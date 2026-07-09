"use client";

import Link from "next/link";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Notifications</h1>
          <p className="text-sm text-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Shift updates, approvals, and pay alerts will appear here in real time."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const url = n.data?.url;
            const isUnread = n.status !== "READ";
            const content = (
              <Card className={isUnread ? "border-primary/30 bg-primary/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-navy">{n.title}</p>
                      <p className="mt-1 text-sm text-muted">{n.body}</p>
                      <p className="mt-2 text-xs text-muted">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {isUnread && (
                      <button
                        type="button"
                        className="shrink-0 text-xs font-semibold text-primary"
                        onClick={(e) => {
                          e.preventDefault();
                          void markRead(n.id);
                        }}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );

            return url ? (
              <Link key={n.id} href={url} onClick={() => isUnread && markRead(n.id)}>
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
