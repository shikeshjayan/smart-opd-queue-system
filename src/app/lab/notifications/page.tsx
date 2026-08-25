"use client";

import { Suspense } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { NotificationList } from "@/features/notifications/components/NotificationList";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef } from "react";

function LabNotificationsContent() {
  const { user } = useAuth();
  const { notifications, isLoading, error, reload, unread, markRead, markAllRead } = useNotifications();
  const busyIdsRef = useRef<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error} <button onClick={reload} className="ml-2 text-brand-600 underline">Retry</button></div>;
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Lab Notifications"
        description="New orders, critical results requiring review, and verification updates."
        actions={
          <NotificationBell />
        }
      />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-ink-900">
            Notifications {unread > 0 && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">{unread}</span>}
          </h3>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-sm font-medium text-brand-700 hover:underline">
              Mark all as read
            </button>
          )}
        </div>
        <NotificationList
          notifications={notifications}
          onMarkRead={async (id) => {
            busyIdsRef.current.add(id);
            try {
              await markRead(id);
            } finally {
              busyIdsRef.current.delete(id);
            }
          }}
          busyIds={busyIdsRef.current}
          emptyMessage="No notifications"
        />
      </div>
    </div>
  );
}

export default function LabNotificationsPage() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-48 w-full" /></div>}>
      <LabNotificationsContent />
    </Suspense>
  );
}