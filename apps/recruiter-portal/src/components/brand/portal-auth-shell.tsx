import Link from "next/link";
import { SOMPACARE_BRAND } from "@sompacare/shared";
import { Logo } from "@/components/brand/logo";

type Props = {
  portalLabel: string;
  subtitle: string;
  children: React.ReactNode;
};

export function PortalAuthShell({ portalLabel, subtitle, children }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex justify-center">
          <Logo height={56} />
        </div>
        <h1 className="mt-6 text-center text-2xl font-bold text-navy">{portalLabel}</h1>
        <p className="mt-2 text-center text-sm text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-6 text-center text-sm text-muted">
          <Link
            href={SOMPACARE_BRAND.marketingUrl}
            className="font-semibold text-primary hover:underline"
          >
            sompacare.com
          </Link>
          {" · "}
          <Link
            href={SOMPACARE_BRAND.careersUrl}
            className="font-semibold text-primary hover:underline"
          >
            Careers
          </Link>
        </p>
      </div>
    </div>
  );
}
