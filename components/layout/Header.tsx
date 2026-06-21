"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { CloseIcon, MenuIcon, PhoneIcon } from "@/components/icons";
import { PrimaryButton } from "@/components/ui/Primitives";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { navLinks, siteConfig } from "@/lib/data";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-brand-navy/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Logo variant="light" size="md" />

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-200 ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={siteConfig.phoneHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-white/75 transition-colors hover:text-white"
          >
            <PhoneIcon className="h-4 w-4" />
            <span className="hidden xl:inline">{siteConfig.phone}</span>
          </a>
          <ThemeToggle />
          <PrimaryButton href="/contact#request-staff" className="!px-5 !py-2.5 !text-xs">
            Request Staff
          </PrimaryButton>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="flex items-center justify-center rounded-lg border border-white/20 p-2.5 text-white transition-colors hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/10 lg:hidden"
          >
            <nav className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto px-4 py-4" aria-label="Mobile navigation">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/75 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <a
                href={siteConfig.phoneHref}
                className="mt-2 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white/75"
              >
                <PhoneIcon className="h-4 w-4" />
                {siteConfig.phone}
              </a>
              <Link
                href="/contact#request-staff"
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-xl bg-brand-blue px-4 py-3.5 text-center text-sm font-semibold text-white"
              >
                Request Staff
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
