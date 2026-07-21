"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import {
  isAlreadySignedInClerkError,
  isAlreadyVerifiedClerkError,
  isEmailVerificationVerified,
  isSompacareCompanyEmail,
  normalizeEmailVerificationCode,
} from "@sompacare/shared";
import { PasswordField } from "@/components/auth/password-field";
import { CLERK_INIT_TIMEOUT_HELP, CLERK_MISSING_KEY_HELP, formatClerkError, hasClerkPublishableKey } from "@/lib/clerk";
import { useRedirectIfSignedIn } from "@/hooks/use-redirect-if-signed-in";

const CLERK_LOAD_TIMEOUT_MS = 15_000;

type Props = {
  afterSignUpUrl?: string;
  signInUrl?: string;
};

export function PortalSignUpFlow({
  afterSignUpUrl = "/home",
  signInUrl = "/sign-in",
}: Props) {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { signIn: clerkSignInClient, isLoaded: signInLoaded } = useSignIn();
  const router = useRouter();
  const [step, setStep] = useState<"register" | "verify">("register");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const pendingPasswordRef = useRef("");
  const redirecting = useRedirectIfSignedIn(afterSignUpUrl);

  useEffect(() => {
    if (isLoaded && signUp) {
      setLoadTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => setLoadTimedOut(true), CLERK_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isLoaded, signUp]);

  useEffect(() => {
    if (!isLoaded || !signUp || step === "verify") {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await signUp.reload();
        if (cancelled) return;

        const email = signUp.emailAddress?.trim() || null;

        const needsEmailCode =
          signUp.status === "missing_requirements" &&
          (signUp.unverifiedFields?.includes("email_address") ||
            signUp.verifications?.emailAddress?.status === "unverified");

        if (needsEmailCode && email) {
          setPendingEmail(email);
          setStep("verify");
          setSuccess(`Enter the verification code we sent to ${email}.`);
        }
      } catch {
        /* fresh sign-up */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, signUp, step]);

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

  if (!isLoaded || !signUp || !signInLoaded) {
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
          aria-label="Loading sign-up"
        />
        <p className="text-sm text-muted">Loading sign-up…</p>
      </div>
    );
  }

  const clerkSignUp = signUp;
  const activateSession = setActive;

  async function activateSessionIfComplete(): Promise<boolean> {
    await clerkSignUp.reload();
    const sessionId = clerkSignUp.createdSessionId;
    if (clerkSignUp.status === "complete" && sessionId && activateSession) {
      await activateSession({ session: sessionId });
      router.replace(afterSignUpUrl);
      return true;
    }
    return false;
  }

  async function signInWithPendingPassword(): Promise<boolean> {
    const email = pendingEmail.trim();
    const password = pendingPasswordRef.current;
    if (!email || !password || !clerkSignInClient || !activateSession) {
      return false;
    }

    const result = await clerkSignInClient.create({
      identifier: email,
      password,
    });

    if (result.status === "complete" && result.createdSessionId) {
      await activateSession({ session: result.createdSessionId });
      router.replace(afterSignUpUrl);
      return true;
    }

    return false;
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = new FormData(e.currentTarget);
    const nextEmail = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (!nextEmail || !password) {
      setError("Enter your company email and choose a password.");
      return;
    }

    if (!isSompacareCompanyEmail(nextEmail)) {
      setError("Recruiter access is limited to @sompacare.com company email addresses.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    pendingPasswordRef.current = password;
    setBusy(true);

    try {
      const signUpWithReset = clerkSignUp as typeof clerkSignUp & { reset?: () => void };
      signUpWithReset.reset?.();

      const result = await clerkSignUp.create({
        emailAddress: nextEmail,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await activateSession({ session: result.createdSessionId });
        router.replace(afterSignUpUrl);
        return;
      }

      if (result.status === "missing_requirements") {
        await clerkSignUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingEmail(nextEmail);
        setStep("verify");
        setSuccess(`We sent a verification code to ${nextEmail}.`);
        return;
      }

      setError("Unable to finish account setup. Contact your Sompacare admin.");
    } catch (err) {
      if (isAlreadySignedInClerkError(err)) {
        router.replace(afterSignUpUrl);
        return;
      }
      setError(formatClerkError(err, "Unable to create your account."));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = new FormData(e.currentTarget);
    const code = normalizeEmailVerificationCode(String(form.get("code") ?? ""));

    if (!code) {
      setError("Enter the verification code from your email.");
      return;
    }

    setBusy(true);

    try {
      const result = await clerkSignUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete" && result.createdSessionId && activateSession) {
        await activateSession({ session: result.createdSessionId });
        router.replace(afterSignUpUrl);
        return;
      }

      if (await activateSessionIfComplete()) {
        return;
      }

      if (isEmailVerificationVerified(clerkSignUp) || isEmailVerificationVerified(result)) {
        if (await signInWithPendingPassword()) {
          return;
        }
        setSuccess("Email verified. Sign in with your password to continue.");
        router.replace(signInUrl);
        return;
      }

      const missing = clerkSignUp.missingFields?.length
        ? ` Still needed: ${clerkSignUp.missingFields.join(", ")}.`
        : "";
      setError(`Verification incomplete. Check the code and try again.${missing}`);
    } catch (err) {
      if (isAlreadyVerifiedClerkError(err) || isAlreadySignedInClerkError(err)) {
        if (await activateSessionIfComplete()) {
          return;
        }
        if (await signInWithPendingPassword()) {
          return;
        }
        router.replace(signInUrl);
        return;
      }
      setError(formatClerkError(err, "Invalid verification code."));
    } finally {
      setBusy(false);
    }
  }

  if (step === "verify") {
    return (
      <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        )}
        {pendingEmail && (
          <p className="text-xs text-muted">Verifying {pendingEmail}</p>
        )}
        <div>
          <label htmlFor="code" className="mb-2 block text-xs font-semibold uppercase text-navy">
            Verification code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            placeholder="123456"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Verifying…" : "Verify & continue"}
        </button>
        <p className="text-center text-sm text-muted">
          Wrong email?{" "}
          <button
            type="button"
            className="font-semibold text-primary hover:underline"
            onClick={() => {
              const signUpWithReset = clerkSignUp as typeof clerkSignUp & { reset?: () => void };
              signUpWithReset.reset?.();
              pendingPasswordRef.current = "";
              setStep("register");
              setPendingEmail("");
              setError(null);
              setSuccess(null);
            }}
          >
            Start over
          </button>
        </p>
      </form>
    );
  }

  return (
    <>
      <form onSubmit={(e) => void handleRegister(e)} className="space-y-4">
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
          <p className="mt-2 text-xs text-muted">Only @sompacare.com addresses can join the recruiter portal.</p>
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase text-navy">
            Password
          </label>
          <PasswordField
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
          />
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-xs font-semibold uppercase text-navy"
          >
            Confirm password
          </label>
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            minLength={8}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={signInUrl} className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
