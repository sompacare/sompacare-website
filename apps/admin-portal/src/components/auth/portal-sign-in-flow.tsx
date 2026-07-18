"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { formatClerkError } from "@/lib/clerk";

type Props = {
  afterSignInUrl?: string;
};

export function PortalSignInFlow({ afterSignInUrl = "/home" }: Props) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!isLoaded || !signIn) {
      setError("Authentication is still loading. Please wait a moment and try again.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError("Enter your company email and password.");
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
        router.replace(afterSignInUrl);
        return;
      }

      setError("Additional verification is required. Check your email or contact support.");
    } catch (err) {
      setError(formatClerkError(err, "Invalid company email or password."));
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
          Company Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@sompacare.com"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase text-navy">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
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
