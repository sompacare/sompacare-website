"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { X } from "lucide-react";
import type { Invoice, PayInvoiceResult } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

type CheckoutFormProps = {
  invoiceId: string;
  paymentIntentId: string;
  amount: number;
  onSuccess: () => void;
  confirmPayment: (invoiceId: string, paymentIntentId: string) => Promise<void>;
};

function CheckoutForm({
  invoiceId,
  paymentIntentId,
  amount,
  onSuccess,
  confirmPayment,
}: CheckoutFormProps) {
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
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed.");
      setLoading(false);
      return;
    }

    try {
      await confirmPayment(invoiceId, paymentIntentId);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment confirmation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted">
        Amount due: <strong className="text-navy">{formatCurrency(amount)}</strong>
      </p>
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={!stripe || loading}>
        {loading ? "Processing…" : "Pay now"}
      </Button>
    </form>
  );
}

type InvoiceCheckoutModalProps = {
  invoice: Invoice | null;
  onClose: () => void;
  onPaid: () => void;
  payInvoice: (id: string) => Promise<PayInvoiceResult>;
  confirmPayment: (invoiceId: string, paymentIntentId: string) => Promise<void>;
};

export function InvoiceCheckoutModal({
  invoice,
  onClose,
  onPaid,
  payInvoice,
  confirmPayment,
}: InvoiceCheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const payInvoiceRef = useRef(payInvoice);
  const onPaidRef = useRef(onPaid);
  const onCloseRef = useRef(onClose);

  payInvoiceRef.current = payInvoice;
  onPaidRef.current = onPaid;
  onCloseRef.current = onClose;

  const invoiceId = invoice?.id ?? null;

  useEffect(() => {
    if (!invoiceId) {
      setClientSecret(null);
      setPaymentIntentId(null);
      setAmount(0);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    payInvoiceRef.current(invoiceId)
      .then((result) => {
        if (cancelled) return;
        setAmount(result.amount);
        if (result.devPaid) {
          onPaidRef.current();
          onCloseRef.current();
          return;
        }
        setClientSecret(result.clientSecret);
        setPaymentIntentId(result.paymentIntentId);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to start checkout.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  if (!invoice) return null;

  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        role="dialog"
        aria-labelledby="invoice-checkout-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="invoice-checkout-title" className="text-lg font-bold text-navy">
              Pay invoice
            </h2>
            <p className="text-sm text-muted">{invoice.invoiceNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && <p className="text-sm text-muted">Preparing secure checkout…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && clientSecret && paymentIntentId && stripeKey && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "stripe" } }}
          >
            <CheckoutForm
              invoiceId={invoice.id}
              paymentIntentId={paymentIntentId}
              amount={amount}
              onSuccess={() => {
                onPaid();
                onClose();
              }}
              confirmPayment={confirmPayment}
            />
          </Elements>
        )}

        {!loading && !error && clientSecret && !stripeKey && (
          <p className="text-sm text-amber-800">
            Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to accept card
            payments.
          </p>
        )}
      </div>
    </div>
  );
}
