"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { PasswordField } from "@/components/auth/password-field";
import { CLERK_INIT_TIMEOUT_HELP, CLERK_MISSING_KEY_HELP, formatClerkError, hasClerkPublishableKey } from "@/lib/clerk";

const CLERK_LOAD_TIMEOUT_MS = 15_000;

type Props = {
  afterSignInUrl?: string;
  signUpUrl?: string;
  forgotPasswordUrl?: string;
};

export function PortalSignInFlow({
  afterSignInUrl = "/home",
  signUpUrl = "/sign-up",
  forgotPasswordUrl = "/forgot-password",
}: Props) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
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

  if (!hasClerkPublishableKey()) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        {CLERK_MISSING_KEY_HELP}
      </p>
    );
  }

  if (!isLoaded || !signIn) {
    if (loadTimedOut) {
      return (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {CLERK_INIT_TIMEOUT_HELP}
        </p>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3 py-8" aria-live="polite" aria-busy="true">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label="Loading sign-in"
        />
        <p className="text-sm text-muted">Loading sign-in…</p>
      </div>
    );
  }

  const clerkSignIn = signIn;
  const activateSession = setActive;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setBusy(true);

    try {
      const result = await clerkSignIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await activateSession({ session: result.createdSessionId });
        router.replace(afterSignInUrl);
        return;
      }

      setError("Additional verification is required. Check your email or contact support.");
    } catch (err) {
      setError(formatClerkError(err, "Invalid email or password."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase text-navy">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-xs font-semibold uppercase text-navy">
            Password
          </label>
          <Link
            href={forgotPasswordUrl}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordField id="password" />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Signing in..." : "Sign In"}
      </button>

      <p className="text-center text-sm text-muted">
        Need an account?{" "}
        <Link href={signUpUrl} className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
