import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { NotificationList } from "@/features/notifications/components/NotificationList";
import { NotificationPreferences } from "@/features/notifications/components/NotificationPreferences";
import { useNotifications, useNotificationPreferences } from "@/features/notifications/hooks/useNotifications";
import type { NotificationCategory } from "@/features/notifications/types/notification.types";
import { useAuth } from "@/features/auth/hooks/useAuth";

const CATEGORY_OPTIONS: Array<{ value: NotificationCategory | "all"; label: string }> = [
  { value: "all", label: "All categories" },
  { value: "queue", label: "Queue" },
  { value: "appointment", label: "Appointment" },
  { value: "clinical", label: "Clinical" },
  { value: "followup", label: "Follow-up" },
  { value: "announcement", label: "Announcement" },
  { value: "system", label: "System" },
];

function NotificationsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const { notifications, isLoading, error, reload, unread, markRead, markAllRead, connection } = useNotifications();
  const { prefs, isLoading: prefsLoading, save } = useNotificationPreferences();

  const [tab, setTab] = useState<"all" | "unread" | "preferences">(
    searchParams.get("tab") === "preferences" ? "preferences" : "all"
  );
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const all = notifications ?? [];

  const filtered = all.filter((n) => {
    if (tab === "unread" && n.read) return false;
    if (category !== "all" && n.category !== category) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">
          Notifications {unread > 0 && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">{unread}</span>}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {filtered.length} of {all.length} notifications
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={tab === "all" ? "primary" : "outline"} onClick={() => setTab("all")}>
          All
        </Button>
        <Button variant={tab === "unread" ? "primary" : "outline"} onClick={() => setTab("unread")}>
          Unread
        </Button>
        <Button variant={tab === "preferences" ? "primary" : "outline"} onClick={() => setTab("preferences")}>
          Preferences
        </Button>
      </div>

      {tab === "preferences" ? (
        <NotificationPreferences prefs={prefs} onSave={save} loading={prefsLoading} />
      ) : (
        <>
          {filtered.length > 0 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NotificationCategory | "all")}
              className="h-11 w-64 rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900 focus:outline-2 focus:outline-brand-600"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          <NotificationList
            notifications={filtered}
            onMarkRead={async (id) => {
              setBusyIds((s) => new Set(s).add(id));
              try {
                await markRead(id);
              } finally {
                setBusyIds((s) => { const n = new Set(s); n.delete(id); return n; });
              }
            }}
            busyIds={busyIds}
            emptyMessage={tab === "unread" ? "No unread notifications" : "No notifications in this category"}
          />
          {all.length > 0 && all.some((n) => !n.read) && (
            <div className="flex justify-end">
              <Button onClick={markAllRead} disabled={unread === 0}>
                Mark all as read
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PatientNotificationsPage() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-6"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-48 w-full" /></div>}>
      <NotificationsContent />
    </Suspense>
  );
}