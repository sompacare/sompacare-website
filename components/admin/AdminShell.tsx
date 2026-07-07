"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { adminNav, isPaymentsSection } from "@/lib/admin-nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-brand-navy">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-brand-navy transition-transform lg:static lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col px-4 py-5">
            <div className="mb-6 px-2">
              <Logo size="sm" />
              <p className="mt-2 text-[10px] font-semibold tracking-widest text-white/50 uppercase">
                Admin Dashboard
              </p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Admin navigation">
              {adminNav.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/65 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                    {item.children && isPaymentsSection(pathname) && item.href === "/admin/payments" && (
                      <div className="mt-1 ml-3 space-y-0.5 border-l border-white/10 pl-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block rounded-md px-2 py-1.5 text-xs transition-colors ${
                              pathname === child.href
                                ? "bg-brand-green/20 text-brand-green-light"
                                : "text-white/50 hover:text-white"
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-white/10 pt-4">
              <AdminSignOutButton variant="sidebar" />
            </div>
          </div>
        </aside>

        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium"
            >
              Menu
            </button>
            <span className="text-sm font-semibold">Sompacare Admin</span>
            <div className="w-16" />
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
