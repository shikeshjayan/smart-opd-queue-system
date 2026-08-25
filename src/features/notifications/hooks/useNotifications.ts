"use client";

import { useCallback, useEffect, useState } from "react";
import { useAsync } from "@/lib/use-async";
import { useRealtime } from "@/features/realtime/hooks/useRealtime";
import { notificationApi } from "../api/notifications.server";
import type { Notification, NotificationPreference } from "../types/notification.types";

export function useNotifications() {
  const { data: notifications, isLoading, error, reload } = useAsync(
    () => notificationApi.list(50),
    [],
    [] as any[]
  );

  const [unread, setUnread] = useState<number>(0);
  const { status: connection, subscribe } = useRealtime();

  // Load unread count
  useEffect(() => {
    notificationApi.unreadCount().then((c) => setUnread(c));
  }, [notifications]);

  // Refresh on NOTIFICATION_EVENT via realtime bus
  useEffect(() => {
    return subscribe("*", (event) => {
      if (event.type === "NOTIFICATION_EVENT" || event.type === "CONNECTION_CHANGED") {
        reload();
      }
    });
  }, [subscribe, reload]);

  // Lazy worker drain on dashboard load (§17: safety net)
  useEffect(() => {
    notificationApi.drainQueue(10).catch(() => {});
  }, []);

  const markRead = useCallback(async (id: string) => {
    await notificationApi.markRead(id);
    setUnread((c) => Math.max(0, c - 1));
    reload();
  }, [reload]);

  const markAllRead = useCallback(async () => {
    await notificationApi.markAllRead();
    setUnread(0);
    reload();
  }, [reload]);

  return {
    notifications: notifications ?? [],
    isLoading,
    error,
    unread,
    reload,
    markRead,
    markAllRead,
    connection,
  };
}

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const { subscribe } = useRealtime();

  const refresh = useCallback(() => {
    notificationApi.unreadCount().then(setCount);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    return subscribe("*", (event) => {
      if (event.type === "NOTIFICATION_EVENT") refresh();
    });
  }, [subscribe, refresh]);

  return { count, refresh };
}

export function useNotificationPreferences() {
  const { data: prefs, isLoading, error, reload } = useAsync(
    () => notificationApi.getPreferences() as Promise<NotificationPreference | null>,
    []
  );

  const save = useCallback(async (input: Partial<NotificationPreference>) => {
    await notificationApi.savePreferences(input);
    reload();
  }, [reload]);

  return { prefs, isLoading, error, save };
}
