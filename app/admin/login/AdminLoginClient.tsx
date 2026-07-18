"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SOMPACARE_BRAND } from "@sompacare/shared";
import { Logo } from "@/components/brand/Logo";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.6 0 10 7 10 7a16.6 16.6 0 0 1-4.1 5.2" />
      <path d="M6.1 6.1 1 12s3.5 7 10 7a9.7 9.7 0 0 0 4.9-1.3" />
      <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      const next = searchParams.get("next") || "/admin/applications";
      router.push(next);
      router.refresh();
    } catch {
      setError("Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        <h1 className="mt-6 text-center text-2xl font-bold text-brand-navy">Application Dashboard</h1>
        <p className="mt-2 text-center text-sm text-brand-slate">
          Sign in with your company email and password to review healthcare professional applications.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase text-brand-navy">
              Company Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@sompacare.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              required
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-xs font-semibold uppercase text-brand-navy">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotHelp((value) => !value)}
                className="text-xs font-semibold text-brand-blue hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {showForgotHelp && (
              <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-brand-slate">
                Dashboard access is managed by your platform administrator. Contact{" "}
                <a href={`mailto:${SOMPACARE_BRAND.email}`} className="font-semibold text-brand-blue hover:underline">
                  {SOMPACARE_BRAND.email}
                </a>{" "}
                to reset your credentials.
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-slate">
          <Link href={SOMPACARE_BRAND.marketingUrl} className="font-semibold text-brand-blue hover:underline">
            sompacare.com
          </Link>
        </p>
      </div>
    </div>
  );
}
