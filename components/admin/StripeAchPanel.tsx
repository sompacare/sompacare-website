"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function AchSetupForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const result = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: `${window.location.origin}/admin/payments/ach?setup=success` },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Setup failed.");
      setLoading(false);
      return;
    }

    onSuccess();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="rounded-full bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save Bank Account"}
      </button>
    </form>
  );
}

function AchChargeForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
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
      confirmParams: { return_url: `${window.location.origin}/admin/payments/ach?payment=success` },
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
      <p className="text-sm text-brand-slate">
        Charge amount: <strong>${amount.toFixed(2)}</strong> via ACH
      </p>
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="rounded-full bg-brand-green px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Processing..." : "Collect ACH Payment"}
      </button>
    </form>
  );
}

type StripeAchPanelProps = {
  mode: "setup" | "charge";
  clientId: string;
  invoiceId?: string;
  amount?: number;
  stripeConfigured: boolean;
};

export function StripeAchPanel({ mode, clientId, invoiceId, amount, stripeConfigured }: StripeAchPanelProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!stripeConfigured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Add <code className="rounded bg-amber-100 px-1">STRIPE_SECRET_KEY</code> and{" "}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to enable Stripe ACH.
      </div>
    );
  }

  async function initStripe() {
    setLoading(true);
    setError("");
    try {
      const endpoint =
        mode === "setup"
          ? "/api/admin/stripe/ach/setup"
          : "/api/admin/stripe/ach/charge";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, invoiceId, amount }),
      });
      const data = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !data.clientSecret) {
        setError(data.error ?? "Unable to initialize Stripe.");
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-brand-slate">
          {mode === "setup"
            ? "Connect a verified US bank account for this client using Stripe ACH."
            : "Collect an ACH payment against the selected invoice."}
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={initStripe}
          disabled={loading || (mode === "charge" && (!invoiceId || !amount))}
          className="mt-4 rounded-full bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Loading..." : mode === "setup" ? "Set Up ACH Bank Account" : "Start ACH Payment"}
        </button>
      </div>
    );
  }

  const options = { clientSecret, appearance: { theme: "stripe" as const } };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      {message && <p className="mb-4 text-sm font-medium text-brand-green">{message}</p>}
      <Elements stripe={stripePromise} options={options}>
        {mode === "setup" ? (
          <AchSetupForm onSuccess={() => setMessage("Bank account saved successfully.")} />
        ) : (
          <AchChargeForm
            amount={amount ?? 0}
            onSuccess={() => setMessage("ACH payment submitted. Status updates via Stripe webhook.")}
          />
        )}
      </Elements>
    </div>
  );
}
