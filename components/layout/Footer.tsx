import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { PrimaryButton } from "@/components/ui/Primitives";
import { footerNav, siteConfig } from "@/lib/data";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-brand-navy">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo variant="light" size="md" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/50">
              Nationwide healthcare staffing for CNAs, LPNs, and RNs — plus home care and
              HR workforce solutions for hospitals, nursing homes, and senior living facilities.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryButton href="/careers" className="!px-6 !py-3 !text-xs">
                Find Shifts
              </PrimaryButton>
              <Link
                href="/contact#request-staff"
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-xs font-semibold text-white transition-colors hover:bg-white/10"
              >
                Request Staff
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-[0.15em] text-white uppercase">Solutions</h4>
            <ul className="mt-5 space-y-3">
              {footerNav.solutions.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/50 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-[0.15em] text-white uppercase">Insights</h4>
            <ul className="mt-5 space-y-3">
              {footerNav.insights.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/50 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-[0.15em] text-white uppercase">Company</h4>
            <ul className="mt-5 space-y-3">
              {footerNav.company.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/50 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2">
              <a href={siteConfig.phoneHref} className="block text-sm text-white/50 transition-colors hover:text-white">
                {siteConfig.phone}
              </a>
              <a href={`mailto:${siteConfig.email}`} className="block text-sm text-white/50 transition-colors hover:text-white">
                {siteConfig.email}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/contact" className="text-xs text-white/40 transition-colors hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
