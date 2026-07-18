"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { SOMPACARE_BRAND } from "@sompacare/shared";
import { PasswordField } from "@/components/auth/password-field";
import { Logo } from "@/components/brand/logo";
import { formatClerkError } from "@/lib/clerk";

const CLERK_LOAD_TIMEOUT_MS = 15_000;

export function NurseSignInFlow() {
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

  if (!isLoaded || !signIn) {
    if (loadTimedOut) {
      return (
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Sign-in is taking longer than expected. Confirm{" "}
            <code className="text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> is set for this
            service, then refresh the page.
          </p>
        </div>
      );
    }

    return (
      <div
        className="flex w-full max-w-md flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 py-12 shadow-lg"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label="Loading sign-in"
        />
        <p className="text-sm text-muted">Loading sign-in…</p>
      </div>
    );
  }

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
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/home");
        return;
      }

      setError("Additional verification is required. Check your email or contact HR.");
    } catch (err) {
      setError(formatClerkError(err, "Invalid email or password."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
      <div className="flex flex-col items-center text-center">
        <Logo height={56} subtitle={SOMPACARE_BRAND.tagline} />
        <h1 className="mt-6 text-2xl font-bold text-navy">Nurse Portal</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in with your email and password to access shifts.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
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
              href="/forgot-password"
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
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New hire?{" "}
        <Link href="/sign-up" className="font-semibold text-primary hover:underline">
          Create your account
        </Link>
        {" · "}
        <Link
          href={SOMPACARE_BRAND.careersUrl}
          className="font-semibold text-primary hover:underline"
        >
          Apply first
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-muted">
        <Link
          href={SOMPACARE_BRAND.marketingUrl}
          className="font-semibold text-primary hover:underline"
        >
          sompacare.com
        </Link>
      </p>
    </div>
  );
}
