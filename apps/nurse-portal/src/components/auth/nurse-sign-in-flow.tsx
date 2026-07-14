"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { SOMPACARE_BRAND } from "@sompacare/shared";
import { Logo } from "@/components/brand/logo";

export function NurseSignInFlow() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo height={56} subtitle={SOMPACARE_BRAND.tagline} />
        <p className="mt-4 text-sm text-muted">
          Sign in with your email and password to access shifts
        </p>
      </div>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
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
