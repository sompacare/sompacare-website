"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { isSompacareCompanyEmail } from "@sompacare/shared";
import { formatClerkError } from "@/lib/clerk";
import { PasswordField } from "@/components/auth/password-field";

const CLERK_LOAD_TIMEOUT_MS = 15_000;

type Props = {
  afterResetUrl?: string;
  signInUrl?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
};

export function ForgotPasswordFlow({
  afterResetUrl = "/home",
  signInUrl = "/sign-in",
  emailLabel = "Company Email",
  emailPlaceholder = "you@sompacare.com",
}: Props) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded && signIn) {
      setLoadTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => setLoadTimedOut(true), CLERK_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isLoaded, signIn]);

  if (!isLoaded || !signIn) {
    if (loadTimedOut) {
      return (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Password reset is taking longer than expected. Confirm{" "}
          <code className="text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> is set for this
          service, then refresh the page.
        </p>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3 py-8" aria-live="polite" aria-busy="true">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label="Loading password reset"
        />
        <p className="text-sm text-muted">Loading password reset…</p>
      </div>
    );
  }

  const clerkSignIn = signIn;
  const activateSession = setActive;

  async function handleRequestCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = new FormData(e.currentTarget);
    const identifier = String(form.get("email") ?? "").trim();

    if (!identifier) {
      setError("Enter your company email.");
      return;
    }

    if (!isSompacareCompanyEmail(identifier)) {
      setError("Use your @sompacare.com company email.");
      return;
    }

    setBusy(true);

    try {
      await clerkSignIn.create({
        strategy: "reset_password_email_code",
        identifier,
      });
      setStep("reset");
      setSuccess(`We sent a reset code to ${identifier}. Check your inbox.`);
    } catch (err) {
      setError(formatClerkError(err, "Unable to send a reset code. Check your email and try again."));
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = new FormData(e.currentTarget);
    const code = String(form.get("code") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (!code || !password) {
      setError("Enter the reset code and a new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const result = await clerkSignIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await activateSession({ session: result.createdSessionId });
        router.replace(afterResetUrl);
        return;
      }

      setError("Additional verification is required. Contact support for help.");
    } catch (err) {
      setError(formatClerkError(err, "Unable to reset your password. Check the code and try again."));
    } finally {
      setBusy(false);
    }
  }

  if (step === "reset") {
    return (
      <div className="space-y-4">
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={(e) => void handleResetPassword(e)} className="space-y-4">
          <div>
            <label htmlFor="code" className="mb-2 block text-xs font-semibold uppercase text-navy">
              Reset Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder="Enter the code from your email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase text-navy">
              New Password
            </label>
            <PasswordField
              id="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-xs font-semibold uppercase text-navy"
            >
              Confirm Password
            </label>
            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              minLength={8}
              placeholder="Re-enter your new password"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Resetting password..." : "Reset Password"}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setError(null);
              setSuccess(null);
            }}
            className="font-semibold text-primary hover:underline"
          >
            Use a different email
          </button>
          {" · "}
          <Link href={signInUrl} className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={(e) => void handleRequestCode(e)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase text-navy">
            {emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={emailPlaceholder}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Sending code..." : "Send Reset Code"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Remember your password?{" "}
        <Link href={signInUrl} className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
