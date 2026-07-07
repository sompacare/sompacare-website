import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripePublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export async function ensureStripeCustomer(input: {
  clientId: string;
  name: string;
  email?: string | null;
  existingCustomerId?: string | null;
}): Promise<string> {
  const stripe = getStripe();
  if (input.existingCustomerId) {
    return input.existingCustomerId;
  }
  const customer = await stripe.customers.create({
    name: input.name,
    email: input.email ?? undefined,
    metadata: { sompacare_client_id: input.clientId },
  });
  return customer.id;
}
