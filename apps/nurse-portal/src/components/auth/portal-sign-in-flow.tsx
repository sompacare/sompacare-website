"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { isAlreadySignedInClerkError } from "@sompacare/shared";
import { PasswordField } from "@/components/auth/password-field";
import {
  CLERK_INIT_TIMEOUT_HELP,
  CLERK_INIT_TIMEOUT_HELP_LOCAL,
  CLERK_MISSING_KEY_HELP,
  formatClerkError,
  hasClerkPublishableKey,
} from "@/lib/clerk";
import { useRedirectIfSignedIn } from "@/hooks/use-redirect-if-signed-in";

const CLERK_LOAD_TIMEOUT_MS = 15_000;

type Props = {
  afterSignInUrl?: string;
  forgotPasswordUrl?: string;
};

function SignInConnectingForm({ forgotPasswordUrl }: { forgotPasswordUrl: string }) {
  return (
    <form className="space-y-4" aria-busy="true" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase text-navy">
          Work Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          disabled
          placeholder="you@example.com"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm opacity-70"
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
            tabIndex={-1}
            aria-hidden="true"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          disabled
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm opacity-70"
        />
      </div>
      <button
        type="button"
        disabled
        className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white opacity-60"
      >
        Sign In
      </button>
      <p className="text-center text-xs text-muted" role="status">
        Connecting to sign-in…
      </p>
    </form>
  );
}

export function PortalSignInFlow({
  afterSignInUrl = "/home",
  forgotPasswordUrl = "/forgot-password",
}: Props) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const redirecting = useRedirectIfSignedIn(afterSignInUrl);

  useEffect(() => {
    if (isLoaded && signIn) {
      setLoadTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setLoadTimedOut(true), CLERK_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isLoaded, signIn]);

  if (redirecting) {
    return (
      <div className="flex flex-col items-center gap-3 py-8" aria-live="polite">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label="Redirecting"
        />
        <p className="text-sm text-muted">Taking you to your dashboard…</p>
      </div>
    );
  }

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
          {process.env.NODE_ENV === "development" ? CLERK_INIT_TIMEOUT_HELP_LOCAL : CLERK_INIT_TIMEOUT_HELP}
        </p>
      );
    }
    return <SignInConnectingForm forgotPasswordUrl={forgotPasswordUrl} />;
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
      setError("Enter your work email and password.");
      return;
    }
    setBusy(true);
    try {
      const result = await clerkSignIn.create({ identifier: email, password });
      if (result.status === "complete" && result.createdSessionId) {
        await activateSession({ session: result.createdSessionId });
        router.replace(afterSignInUrl);
        return;
      }
      setError("Additional verification is required. Check your email or contact support.");
    } catch (err) {
      if (isAlreadySignedInClerkError(err)) {
        router.replace(afterSignInUrl);
        return;
      }
      setError(formatClerkError(err, "Invalid email or password."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase text-navy">
          Work Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-xs font-semibold uppercase text-navy">
            Password
          </label>
          <Link href={forgotPasswordUrl} className="text-xs font-semibold text-primary hover:underline">
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
    </form>
  );
}
