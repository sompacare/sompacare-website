"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
  const { unreadCount } = useNotifications();

  return (
    <Link
      href="/notifications"
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-navy transition-colors hover:bg-slate-100",
        className
      )}
      aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
