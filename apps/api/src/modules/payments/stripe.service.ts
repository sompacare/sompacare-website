import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private client: Stripe | null = null;

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get("STRIPE_SECRET_KEY"));
  }

  isDevBypass(): boolean {
    return (
      !this.isConfigured() ||
      this.config.get("PAYMENTS_DEV_BYPASS", "true") === "true"
    );
  }

  getClient(): Stripe {
    const key = this.config.get<string>("STRIPE_SECRET_KEY");
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    if (!this.client) {
      this.client = new Stripe(key);
    }
    return this.client;
  }

  async ensureConnectAccount(input: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    existingAccountId?: string | null;
  }): Promise<string> {
    if (this.isDevBypass()) {
      return input.existingAccountId ?? `acct_dev_${input.userId}`;
    }

    const stripe = this.getClient();
    if (input.existingAccountId) return input.existingAccountId;

    const account = await stripe.v2.core.accounts.create({
      dashboard: "express",
      contact_email: input.email,
      display_name: `${input.firstName} ${input.lastName}`.trim(),
      identity: {
        country: "us",
        entity_type: "individual",
        individual: {
          given_name: input.firstName,
          surname: input.lastName,
          email: input.email,
        },
      },
      defaults: {
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
      metadata: { sompacare_user_id: input.userId },
    });
    return account.id;
  }

  async createConnectOnboardingLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<string> {
    if (this.isDevBypass()) return returnUrl;

    const stripe = this.getClient();
    const link = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["recipient"],
          return_url: returnUrl,
          refresh_url: refreshUrl,
        },
      },
    });
    if (!link.url) throw new Error("Stripe did not return an onboarding URL");
    return link.url;
  }

  async getConnectAccountReady(accountId: string): Promise<boolean> {
    if (this.isDevBypass()) return true;

    const stripe = this.getClient();
    try {
      const account = await stripe.v2.core.accounts.retrieve(accountId, {
        include: ["configuration.recipient", "requirements"],
      });
      const recipient = account.configuration?.recipient;
      const entries = account.requirements?.entries ?? [];
      const hasErrors = entries.some((entry) => entry.errors.length > 0);
      return Boolean(recipient?.applied) && !hasErrors;
    } catch {
      const legacy = await stripe.accounts.retrieve(accountId);
      return Boolean(legacy.payouts_enabled && legacy.charges_enabled);
    }
  }

  async ensureFacilityCustomer(input: {
    facilityId: string;
    name: string;
    email?: string | null;
    existingCustomerId?: string | null;
  }): Promise<string> {
    if (this.isDevBypass()) {
      return input.existingCustomerId ?? `cus_dev_${input.facilityId}`;
    }

    const stripe = this.getClient();
    if (input.existingCustomerId) return input.existingCustomerId;

    const customer = await stripe.customers.create({
      name: input.name,
      email: input.email ?? undefined,
      metadata: { sompacare_facility_id: input.facilityId },
    });
    return customer.id;
  }

  async createInvoicePaymentIntent(input: {
    customerId: string;
    amountCents: number;
    invoiceId: string;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (this.isDevBypass()) {
      return {
        clientSecret: `pi_dev_${input.invoiceId}`,
        paymentIntentId: `pi_dev_${input.invoiceId}`,
      };
    }

    const stripe = this.getClient();
    const intent = await stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: "usd",
      customer: input.customerId,
      metadata: { sompacare_invoice_id: input.invoiceId },
      automatic_payment_methods: { enabled: true },
    });
    if (!intent.client_secret) {
      throw new Error("Stripe did not return a client secret");
    }
    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
  }

  async createInstantPayout(input: {
    accountId: string;
    amountCents: number;
  }): Promise<string> {
    if (this.isDevBypass()) return `tr_dev_${Date.now()}`;

    const stripe = this.getClient();
    const transfer = await stripe.transfers.create({
      amount: input.amountCents,
      currency: "usd",
      destination: input.accountId,
    });
    return transfer.id;
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (this.isDevBypass()) {
      return {
        id: paymentIntentId,
        status: "succeeded",
        metadata: {},
        amount_received: 0,
      } as Stripe.PaymentIntent;
    }
    const stripe = this.getClient();
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }
}
