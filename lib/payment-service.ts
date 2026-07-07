import "server-only";

import { getStripe } from "@/lib/stripe";
import {
  createPayment,
  getClient,
  getInvoice,
  updateClient,
  updateInvoicePaidAmount,
  updatePayment,
} from "@/lib/supabase/ops";
import type { InvoiceRecord } from "@/lib/supabase/ops-types";

export async function createAchSetupIntent(clientId: string) {
  const client = await getClient(clientId);
  if (!client) throw new Error("Client not found.");

  const stripe = getStripe();
  let customerId = client.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: client.name,
      email: client.billing_email ?? client.email ?? undefined,
      metadata: { sompacare_client_id: client.id },
    });
    customerId = customer.id;
    await updateClient(client.id, { stripe_customer_id: customerId });
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["us_bank_account"],
    metadata: { sompacare_client_id: client.id },
  });

  return {
    clientSecret: setupIntent.client_secret,
    customerId,
  };
}

export async function createAchPaymentIntent(input: {
  clientId: string;
  invoiceId: string;
  amount: number;
}) {
  const [client, invoice] = await Promise.all([
    getClient(input.clientId),
    getInvoice(input.invoiceId),
  ]);

  if (!client || !invoice) throw new Error("Client or invoice not found.");
  if (!client.stripe_customer_id) {
    throw new Error("Client is not linked to Stripe. Set up ACH bank account first.");
  }

  const stripe = getStripe();
  const amountCents = Math.round(input.amount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: client.stripe_customer_id,
    payment_method_types: ["us_bank_account"],
    metadata: {
      sompacare_client_id: client.id,
      sompacare_invoice_id: invoice.id,
      sompacare_invoice_number: invoice.invoice_number,
    },
  });

  const payment = await createPayment({
    client_id: client.id,
    invoice_id: invoice.id,
    amount: input.amount,
    method: "ach",
    status: "processing",
    stripe_payment_intent_id: paymentIntent.id,
    metadata: { invoice_number: invoice.invoice_number },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: payment.id,
  };
}

export async function createCardPaymentIntent(input: {
  clientId: string;
  invoiceId: string;
  amount: number;
}) {
  const [client, invoice] = await Promise.all([
    getClient(input.clientId),
    getInvoice(input.invoiceId),
  ]);

  if (!client || !invoice) throw new Error("Client or invoice not found.");

  const stripe = getStripe();
  let customerId = client.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: client.name,
      email: client.billing_email ?? client.email ?? undefined,
      metadata: { sompacare_client_id: client.id },
    });
    customerId = customer.id;
    await updateClient(client.id, { stripe_customer_id: customerId });
  }

  const amountCents = Math.round(input.amount * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: customerId,
    payment_method_types: ["card"],
    metadata: {
      sompacare_client_id: client.id,
      sompacare_invoice_id: invoice.id,
    },
  });

  const payment = await createPayment({
    client_id: client.id,
    invoice_id: invoice.id,
    amount: input.amount,
    method: "credit_card",
    status: "processing",
    stripe_payment_intent_id: paymentIntent.id,
  });

  return { clientSecret: paymentIntent.client_secret, paymentId: payment.id };
}

function resolveInvoiceStatus(invoice: InvoiceRecord, newPaid: number): InvoiceRecord["status"] {
  if (newPaid >= Number(invoice.total)) return "paid";
  if (newPaid > 0) return "partial";
  return invoice.status;
}

export async function applySuccessfulStripePayment(input: {
  paymentIntentId: string;
  chargeId?: string;
  amount: number;
}) {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
  const invoiceId = intent.metadata.sompacare_invoice_id;
  const clientId = intent.metadata.sompacare_client_id;

  const supabase = (await import("@/lib/supabase/admin")).getSupabaseAdmin();
  if (!supabase) return;

  const { data: existing } = await supabase
    .from("payments")
    .select("*")
    .eq("stripe_payment_intent_id", input.paymentIntentId)
    .single();

  if (existing) {
    await updatePayment(existing.id, {
      status: "completed",
      stripe_charge_id: input.chargeId ?? null,
      paid_at: new Date().toISOString(),
    });
  } else {
    await createPayment({
      client_id: clientId,
      invoice_id: invoiceId,
      amount: input.amount / 100,
      method: intent.payment_method_types.includes("us_bank_account") ? "ach" : "credit_card",
      status: "completed",
      stripe_payment_intent_id: input.paymentIntentId,
      stripe_charge_id: input.chargeId,
      paid_at: new Date().toISOString(),
    });
  }

  if (invoiceId) {
    const invoice = await getInvoice(invoiceId);
    if (invoice) {
      const newPaid = Number(invoice.amount_paid) + input.amount / 100;
      await updateInvoicePaidAmount(invoiceId, newPaid, resolveInvoiceStatus(invoice, newPaid));
    }
  }
}

export async function markStripePaymentFailed(paymentIntentId: string) {
  const supabase = (await import("@/lib/supabase/admin")).getSupabaseAdmin();
  if (!supabase) return;
  const { data } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();
  if (data) {
    await updatePayment(data.id, { status: "failed" });
  }
}
