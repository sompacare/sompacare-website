"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useApi } from "@/hooks/use-api";
import type { AppNotification } from "@/lib/notifications";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const WS_URL = API_URL.replace(/\/api\/v1$/, "");
const DEV_TOKEN = process.env.NEXT_PUBLIC_NURSE_PORTAL_DEV_TOKEN
  ? `dev_${process.env.NEXT_PUBLIC_NURSE_PORTAL_DEV_TOKEN}`
  : null;

export function useNotifications() {
  const api = useApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        apiRef.current.getNotifications(),
        apiRef.current.getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count.count);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!DEV_TOKEN) return;

    const socket: Socket = io(`${WS_URL}/realtime`, {
      auth: { token: DEV_TOKEN },
      transports: ["websocket", "polling"],
    });

    socket.on("notification:new", () => {
      void refresh();
    });

    socket.on("shift:updated", () => {
      void refresh();
    });

    return () => {
      socket.disconnect();
    };
  }, [refresh]);

  const markRead = useCallback(
    async (id: string) => {
      await apiRef.current.markNotificationRead(id);
      await refresh();
    },
    [refresh]
  );

  const markAllRead = useCallback(async () => {
    await apiRef.current.markAllNotificationsRead();
    await refresh();
  }, [refresh]);

  return useMemo(
    () => ({ notifications, unreadCount, loading, refresh, markRead, markAllRead }),
    [notifications, unreadCount, loading, refresh, markRead, markAllRead]
  );
}
