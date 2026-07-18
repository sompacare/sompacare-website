"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { SOMPACARE_BRAND } from "@sompacare/shared";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
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
        <div className="w-full max-w-md">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Sign-in is taking longer than expected. Confirm{" "}
            <code className="text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> is set for this
            service, then refresh the page.
          </p>
        </div>
      );
    }

    return (
      <div className="flex w-full max-w-md flex-col items-center gap-3 py-8" aria-live="polite" aria-busy="true">
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
      setError(formatClerkError(err, "Sign in failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo height={56} subtitle={SOMPACARE_BRAND.tagline} />
        <p className="mt-4 text-sm text-muted">
          Sign in with your email and password to access shifts
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
      >
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Your password"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
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
    </div>
  );
}
