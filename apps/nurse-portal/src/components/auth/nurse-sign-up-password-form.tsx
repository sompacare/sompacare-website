"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { SOMPACARE_BRAND } from "@sompacare/shared";
import { Button } from "@/components/ui/button";
import { formatClerkError } from "@/lib/clerk";

type Props = {
  email: string;
};

export function NurseSignUpPasswordForm({ email }: Props) {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!isLoaded || !signUp) {
      setError("Authentication is still loading. Please wait a moment and try again.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (!password) {
      setError("Choose a password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/home");
        return;
      }

      if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setError("Check your email for a verification code, then sign in.");
        return;
      }

      setError("Unable to finish account setup. Contact HR for help.");
    } catch (err) {
      setError(formatClerkError(err, "Unable to create your account."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-navy">Create your password</h2>
        <p className="mt-2 text-sm text-muted">
          Setting up access for <span className="font-medium text-navy">{email}</span>
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
      >
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            placeholder="At least 8 characters"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-navy">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            placeholder="Re-enter your password"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
        {" · "}
        <Link href={SOMPACARE_BRAND.careersUrl} className="font-semibold text-primary hover:underline">
          Careers
        </Link>
      </p>
    </div>
  );
}
