"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/employees/invite", label: "Quick invite" },
  { href: "/employees/new", label: "Full profile" },
];

export function EmployeeSectionNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 border-b border-border pb-3">
      {tabs.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-slate-100 hover:text-navy"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
