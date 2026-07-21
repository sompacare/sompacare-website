"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useClerk, useSignUp } from "@clerk/nextjs";
import {
  isAlreadySignedInClerkError,
  isAlreadyVerifiedClerkError,
  isEmailVerificationVerified,
  isSompacareCompanyEmail,
  normalizeEmailVerificationCode,
  type RecruiterSignUpDraft,
} from "@sompacare/shared";
import {
  clearRecruiterSignUpDraft,
  readRecruiterSignUpDraft,
  writeRecruiterSignUpDraft,
} from "@/lib/recruiter-signup-draft";
import { PasswordField } from "@/components/auth/password-field";
import { CLERK_INIT_TIMEOUT_HELP, CLERK_MISSING_KEY_HELP, formatClerkError, hasClerkPublishableKey } from "@/lib/clerk";
import { activateClerkSession, completeRecruiterSignUp } from "@/lib/clerk-sign-up-complete";
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
  const clerk = useClerk();
  const router = useRouter();
  const [step, setStep] = useState<"register" | "verify">("register");
  const [draft, setDraft] = useState<RecruiterSignUpDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
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
    const stored = readRecruiterSignUpDraft();
    if (stored) {
      setDraft(stored);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !signUp) return;

    let cancelled = false;

    void (async () => {
      try {
        await signUp.reload();
        if (cancelled) return;

        const pending =
          signUp.status === "missing_requirements" &&
          (signUp.unverifiedFields?.includes("email_address") ||
            signUp.verifications?.emailAddress?.status === "unverified" ||
            signUp.verifications?.emailAddress?.status === "transferable");

        const email = signUp.emailAddress?.trim() || readRecruiterSignUpDraft()?.email;
        if (pending && email) {
          setDraft((prev) => prev ?? readRecruiterSignUpDraft() ?? null);
          setStep("verify");
          setSuccess(`Enter the verification code we sent to ${email}.`);
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, signUp]);

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

  if (!isLoaded || !signUp) {
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

  const activeSignUp = signUp;

  async function goHome(sessionId: string) {
    await activateClerkSession(setActive, sessionId);
    clearRecruiterSignUpDraft();
    router.replace(afterSignUpUrl);
  }

  async function trySignInWithDraft(activeDraft: RecruiterSignUpDraft): Promise<boolean> {
    if (!clerk.client) return false;

    try {
      const signInResult = await clerk.client.signIn.create({
        identifier: activeDraft.email,
        password: activeDraft.password,
      });

      if (signInResult.status === "complete" && signInResult.createdSessionId) {
        await clerk.setActive({ session: signInResult.createdSessionId });
        clearRecruiterSignUpDraft();
        router.replace(afterSignUpUrl);
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }

  async function finishAfterVerification(activeDraft: RecruiterSignUpDraft) {
    const completion = await completeRecruiterSignUp(activeSignUp, activeDraft);

    if (completion.status === "complete" && completion.sessionId) {
      await goHome(completion.sessionId);
      return;
    }

    if (isEmailVerificationVerified(activeSignUp) || completion.missingFields.length === 0) {
      if (await trySignInWithDraft(activeDraft)) {
        return;
      }
    }

    if (completion.missingFields.length > 0) {
      setError(
        `Account setup needs: ${completion.missingFields.join(", ")}. Contact Sompacare IT or try sign-in if you already registered.`
      );
      return;
    }

    setError("Verification succeeded but we could not start your session. Sign in with your password.");
    router.replace(signInUrl);
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = new FormData(e.currentTarget);
    const nextEmail = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const legalAccepted = form.get("legalAccepted") === "on";

    if (!nextEmail || !password || !firstName || !lastName) {
      setError("Enter your name, company email, and password.");
      return;
    }

    if (!legalAccepted) {
      setError("Accept the Terms of Service and Privacy Policy to continue.");
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

    const nextDraft: RecruiterSignUpDraft = {
      email: nextEmail,
      password,
      firstName,
      lastName,
      legalAccepted: true,
    };

    writeRecruiterSignUpDraft(nextDraft);
    setDraft(nextDraft);
    setBusy(true);

    try {
      const result = await activeSignUp.create({
        emailAddress: nextEmail,
        password,
        firstName,
        lastName,
        legalAccepted: true,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await goHome(result.createdSessionId);
        return;
      }

      await activeSignUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
      setSuccess(`We sent a verification code to ${nextEmail}.`);
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

    const activeDraft = draft ?? readRecruiterSignUpDraft();
    if (!activeDraft) {
      setError("Your sign-up session expired. Start over and request a new code.");
      setStep("register");
      return;
    }

    const form = new FormData(e.currentTarget);
    const code = normalizeEmailVerificationCode(String(form.get("code") ?? ""));

    if (code.length < 6) {
      setError("Enter the 6-digit verification code from your email.");
      return;
    }

    setBusy(true);

    try {
      await activeSignUp.attemptEmailAddressVerification({ code });
      await finishAfterVerification(activeDraft);
    } catch (err) {
      if (isAlreadyVerifiedClerkError(err) || isAlreadySignedInClerkError(err)) {
        await finishAfterVerification(activeDraft);
        return;
      }
      setError(formatClerkError(err, "Invalid or expired verification code."));
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await activeSignUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setSuccess("We sent a new verification code to your email.");
    } catch (err) {
      setError(formatClerkError(err, "Could not resend the code. Wait a minute and try again."));
    } finally {
      setBusy(false);
    }
  }

  if (step === "verify") {
    const email = draft?.email ?? readRecruiterSignUpDraft()?.email;
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
        {email && <p className="text-xs text-muted">Verifying {email}</p>}
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
            maxLength={6}
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
        <button
          type="button"
          disabled={busy}
          onClick={() => void resendCode()}
          className="w-full text-sm font-semibold text-primary hover:underline disabled:opacity-60"
        >
          Resend code
        </button>
        <p className="text-center text-sm text-muted">
          Wrong email?{" "}
          <button
            type="button"
            className="font-semibold text-primary hover:underline"
            onClick={() => {
              clearRecruiterSignUpDraft();
              setDraft(null);
              setStep("register");
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-2 block text-xs font-semibold uppercase text-navy">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              autoComplete="given-name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-2 block text-xs font-semibold uppercase text-navy">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              autoComplete="family-name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
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
        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            id="legalAccepted"
            name="legalAccepted"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <span>
            I agree to the Sompacare{" "}
            <Link href="https://www.sompacare.com/terms" className="font-semibold text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="https://www.sompacare.com/privacy" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
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
