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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo height={56} subtitle={SOMPACARE_BRAND.tagline} />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
            {portalLabel}
          </p>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>
        {children}
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
