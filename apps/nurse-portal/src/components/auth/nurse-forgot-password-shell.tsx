import Link from "next/link";
import { SOMPACARE_BRAND } from "@sompacare/shared";
import { Logo } from "@/components/brand/logo";

type Props = {
  children: React.ReactNode;
};

export function NurseForgotPasswordShell({ children }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <Logo height={56} subtitle={SOMPACARE_BRAND.tagline} />
          <h1 className="mt-6 text-2xl font-bold text-navy">Reset Password</h1>
          <p className="mt-2 text-sm text-muted">
            Enter your email and we will send a code to reset your password.
          </p>
        </div>
        <div className="mt-8">{children}</div>
        <p className="mt-6 text-center text-sm text-muted">
          <Link
            href={SOMPACARE_BRAND.marketingUrl}
            className="font-semibold text-primary hover:underline"
          >
            sompacare.com
          </Link>
        </p>
      </div>
    </div>
  );
}
