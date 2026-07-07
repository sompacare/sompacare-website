import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { applySuccessfulStripePayment, markStripePaymentFailed } from "@/lib/payment-service";
import type Stripe from "stripe";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      await applySuccessfulStripePayment({
        paymentIntentId: intent.id,
        chargeId: typeof intent.latest_charge === "string" ? intent.latest_charge : undefined,
        amount: intent.amount,
      });
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      await markStripePaymentFailed(intent.id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
