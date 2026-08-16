"use client";

import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import {
  useAdminMutations,
  useAdminNotifications,
} from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import type { AdminNotification } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDateTime } from "@/features/hospital-admin/utils/format";

const typeConfig: Record<AdminNotification["type"], { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  queue: { label: "Queue", variant: "info" },
  system: { label: "System", variant: "default" },
  alert: { label: "Alert", variant: "danger" },
  info: { label: "Info", variant: "success" },
};

export default function NotificationsPage() {
  const { hospitalId } = useHospitalAdmin();
  const { data: notifications, isLoading, error, reload } = useAdminNotifications(hospitalId);
  const mutations = useAdminMutations();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error || !notifications) {
    return <ErrorState message={error ?? "Unable to load notifications."} onRetry={reload} />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleMarkRead(id: string) {
    await mutations.markNotificationRead(id);
    reload();
  }

  async function handleMarkAllRead() {
    await mutations.markAllNotificationsRead(hospitalId);
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Alerts and updates for this hospital."
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              onClick={handleMarkAllRead}
              disabled={mutations.busy}
            >
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You're all caught up."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => {
            const { label, variant } = typeConfig[notification.type];
            return (
              <li
                key={notification.id}
                className={`flex flex-wrap items-start justify-between gap-3 rounded-card border bg-surface p-4 shadow-card ${
                  notification.read ? "border-ink-200 opacity-70" : "border-brand-200"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={variant}>{label}</Badge>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />
                    )}
                    <p className="text-sm font-semibold text-ink-900">{notification.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-ink-700">{notification.message}</p>
                  <p className="mt-1 text-xs text-ink-400">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkRead(notification.id)}
                    disabled={mutations.busy}
                  >
                    Mark read
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
