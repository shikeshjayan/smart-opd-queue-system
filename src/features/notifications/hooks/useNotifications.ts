"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAsync } from "@/lib/use-async";
import { useRealtime } from "@/features/realtime/hooks/useRealtime";
import { notificationMockApi } from "../api/notification.mock";
import type {
  Notification,
  NotificationEventKey,
  NotificationPreferences,
  QueueNotification,
} from "../types/notification.types";
import { DEFAULT_PREFERENCES } from "../types/notification.types";

export type ActiveToken = {
  tokenId: string;
  tokenNumber: string;
  opdId: string;
};

export function useNotifications(patientId: string, activeToken?: ActiveToken | null) {
  const { data: notifications, isLoading, error, reload } = useAsync(
    () => notificationMockApi.list(patientId),
    [patientId]
  );
  const {
    data: preferences,
    reload: reloadPreferences,
  } = useAsync(() => notificationMockApi.getPreferences(patientId), [patientId]);
  const { subscribe } = useRealtime();

  const prefsRef = useRef<NotificationPreferences>(preferences ?? DEFAULT_PREFERENCES);
  useEffect(() => {
    prefsRef.current = preferences ?? DEFAULT_PREFERENCES;
  }, [preferences]);

  const notify = useCallback(
    async (input: Omit<QueueNotification, "id" | "createdAt">, prefsKey?: NotificationEventKey) => {
      if (prefsKey && !prefsRef.current[prefsKey].in_app) return;
      await notificationMockApi.add(patientId, {
        ...input,
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      });
      reload();
    },
    [patientId, reload]
  );

  useEffect(() => {
    if (!activeToken) return;
    return subscribe("*", (event) => {
      if (event.type === "TOKEN_CALLED" && event.tokenNumber === activeToken.tokenNumber) {
        if (!prefsRef.current.token_called.in_app) return;
        void notificationMockApi
          .add(patientId, {
            id: `n_called_${activeToken.tokenNumber}`,
            type: "queue",
            priority: "critical",
            title: "Your token has been called",
            message: `Token ${activeToken.tokenNumber}. Please proceed to your OPD now.`,
            createdAt: new Date().toISOString(),
            tokenNumber: activeToken.tokenNumber,
          })
          .then(() => reload());
      }
    });
  }, [subscribe, activeToken, patientId, reload]);

  const markRead = useCallback(
    async (id: string) => {
      await notificationMockApi.markRead(patientId, id);
      reload();
    },
    [patientId, reload]
  );

  const markAllRead = useCallback(async () => {
    await notificationMockApi.markAllRead(patientId);
    reload();
  }, [patientId, reload]);

  const savePreferences = useCallback(
    async (next: NotificationPreferences) => {
      await notificationMockApi.savePreferences(patientId, next);
      reloadPreferences();
    },
    [patientId, reloadPreferences]
  );

  const unreadCount = (notifications ?? []).filter((n) => !n.readAt).length;

  return {
    notifications,
    isLoading,
    error,
    reload,
    unreadCount,
    markRead,
    markAllRead,
    notify,
    preferences: preferences ?? DEFAULT_PREFERENCES,
    savePreferences,
    preferencesLoading: preferences === undefined,
  };
}

export type { Notification };
