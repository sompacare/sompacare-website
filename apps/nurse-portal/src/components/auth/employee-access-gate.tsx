"use client";

import { useState } from "react";
import Link from "next/link";
import { SOMPACARE_BRAND } from "@sompacare/shared";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import { formatApiError } from "@/lib/api";

const EMPLOYEE_NUMBER_KEY = "sompacare.employeeNumber";
const EMPLOYEE_EMAIL_KEY = "sompacare.employeeEmail";

export function getStoredEmployeeAccess() {
  if (typeof window === "undefined") return { email: "", employeeNumber: "" };
  return {
    email: sessionStorage.getItem(EMPLOYEE_EMAIL_KEY) ?? "",
    employeeNumber: sessionStorage.getItem(EMPLOYEE_NUMBER_KEY) ?? "",
  };
}

export function storeEmployeeAccess(email: string, employeeNumber: string) {
  sessionStorage.setItem(EMPLOYEE_EMAIL_KEY, email.trim());
  sessionStorage.setItem(EMPLOYEE_NUMBER_KEY, employeeNumber.trim().toUpperCase());
}

type Props = {
  mode: "sign-up" | "sign-in";
  initialEmail?: string;
  initialEmployeeNumber?: string;
  onVerified: (email: string, employeeNumber: string) => void;
  externalError?: string | null;
};

export function EmployeeAccessGate({
  mode,
  initialEmail = "",
  initialEmployeeNumber = "",
  onVerified,
  externalError = null,
}: Props) {
  const api = useApi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const nextEmail = String(form.get("email") ?? "").trim();
    const nextEmployeeNumber = String(form.get("employeeNumber") ?? "").trim();

    if (!nextEmail || !nextEmployeeNumber) {
      setError("Enter your work email and employee number.");
      setBusy(false);
      return;
    }

    try {
      await api.verifyEmployee({ email: nextEmail, employeeNumber: nextEmployeeNumber });
      storeEmployeeAccess(nextEmail, nextEmployeeNumber);
      onVerified(nextEmail, nextEmployeeNumber.toUpperCase());
    } catch (err) {
      setError(formatApiError(err, "Unable to verify employee access."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo height={56} subtitle={SOMPACARE_BRAND.tagline} />
        <p className="mt-4 text-sm text-muted">
          {mode === "sign-up"
            ? "Hired clinicians: enter the employee number HR emailed you, then create your password."
            : "Enter your employee number and work email to create your account."}
        </p>
      </div>

      <form onSubmit={(e) => void handleVerify(e)} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={initialEmail}
            placeholder="you@email.com"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="employeeNumber" className="mb-1 block text-sm font-medium text-navy">
            Employee number
          </label>
          <input
            id="employeeNumber"
            name="employeeNumber"
            required
            defaultValue={initialEmployeeNumber}
            placeholder="SC-XXXXXX"
            className="w-full rounded-lg border px-3 py-2 text-sm uppercase"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {externalError && !error && <p className="text-sm text-red-600">{externalError}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Verifying…" : mode === "sign-up" ? "Continue to create account" : "Continue to sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Not hired yet?{" "}
        <Link href={SOMPACARE_BRAND.careersUrl} className="font-semibold text-primary hover:underline">
          Apply on our careers page
        </Link>
        . All new hires must apply through {SOMPACARE_BRAND.marketingUrl.replace("https://", "")} first.
      </p>
    </div>
  );
}
