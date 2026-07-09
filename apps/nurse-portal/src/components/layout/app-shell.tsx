"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Search, UserRound, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/brand/logo";
import { NotificationBell } from "@/components/notifications/notification-bell";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/shifts", label: "Shifts", icon: Search },
  { href: "/assignments", label: "Schedule", icon: CalendarDays },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Logo href="/home" height={28} />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-5">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-1 py-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted hover:text-navy"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
