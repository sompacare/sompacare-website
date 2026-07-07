"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const payrollTabs = [
  { label: "Overview", href: "/admin/payroll" },
  { label: "Pay Runs", href: "/admin/payroll/runs" },
  { label: "Timesheets", href: "/admin/payroll/timesheets" },
  { label: "Employee Pay", href: "/admin/payroll/employees" },
  { label: "Deductions & Tax", href: "/admin/payroll/deductions" },
  { label: "Pay History", href: "/admin/payroll/history" },
  { label: "Reports", href: "/admin/payroll/reports" },
];

export function PayrollSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {payrollTabs.map((tab) => {
        const active =
          tab.href === "/admin/payroll"
            ? pathname === "/admin/payroll"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              active
                ? "bg-brand-navy text-white"
                : "border border-slate-200 bg-white text-brand-slate hover:border-brand-navy hover:text-brand-navy"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
