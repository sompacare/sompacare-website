"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function CardPaymentForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/admin/payments/credit-card?payment=success` },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed.");
      setLoading(false);
      return;
    }

    onSuccess();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-brand-slate">Charge amount: <strong>${amount.toFixed(2)}</strong></p>
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={!stripe || loading} className="rounded-full bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {loading ? "Processing..." : "Charge Card"}
      </button>
    </form>
  );
}

type StripeCardPanelProps = {
  clientId: string;
  invoiceId: string;
  amount: number;
  stripeConfigured: boolean;
};

export function StripeCardPanel({ clientId, invoiceId, amount, stripeConfigured }: StripeCardPanelProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!stripeConfigured) {
    return <p className="text-sm text-amber-800">Configure Stripe keys to accept credit card payments.</p>;
  }

  async function initPayment() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stripe/card/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, invoiceId, amount }),
      });
      const data = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !data.clientSecret) {
        setError(data.error ?? "Unable to start card payment.");
        return;
      }
      setClientSecret(data.clientSecret);
    } catch {
      setError("Unable to connect to Stripe.");
    } finally {
      setLoading(false);
    }
  }

  if (!clientSecret) {
    return (
      <div>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button type="button" onClick={initPayment} disabled={loading || !amount} className="rounded-full bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? "Loading..." : "Start Card Payment"}
        </button>
      </div>
    );
  }

  return (
    <div>
      {message && <p className="mb-4 text-sm font-medium text-brand-green">{message}</p>}
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
        <CardPaymentForm amount={amount} onSuccess={() => setMessage("Card payment submitted successfully.")} />
      </Elements>
    </div>
  );
}
