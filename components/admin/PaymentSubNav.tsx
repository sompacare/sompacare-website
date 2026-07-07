"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const paymentTabs = [
  { label: "Overview", href: "/admin/payments" },
  { label: "Invoices", href: "/admin/payments/invoices" },
  { label: "Outstanding", href: "/admin/payments/outstanding" },
  { label: "Paid", href: "/admin/payments/paid" },
  { label: "ACH", href: "/admin/payments/ach" },
  { label: "Credit Card", href: "/admin/payments/credit-card" },
  { label: "Wire", href: "/admin/payments/wire" },
  { label: "History", href: "/admin/payments/history" },
];

export function PaymentSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {paymentTabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            pathname === tab.href
              ? "bg-brand-blue text-white"
              : "border border-slate-200 bg-white text-brand-slate hover:border-brand-blue hover:text-brand-blue"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
