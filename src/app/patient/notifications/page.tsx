"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { NotificationList } from "@/features/notifications/components/NotificationList";
import { NotificationPreferences } from "@/features/notifications/components/NotificationPreferences";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import type { NotificationType } from "@/features/notifications/types/notification.types";
import { useAuth } from "@/features/auth/hooks/useAuth";

const CATEGORY_OPTIONS: Array<{ value: NotificationType | "all"; label: string }> = [
  { value: "all", label: "All categories" },
  { value: "queue", label: "Queue" },
  { value: "appointment", label: "Appointment" },
  { value: "medical", label: "Medical" },
  { value: "system", label: "System" },
];

function NotificationsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const patientId = user?.id ?? "";

  const { notifications, isLoading, error, reload, unreadCount, markRead, markAllRead, preferences, savePreferences, preferencesLoading } =
    useNotifications(patientId, null);

  const [tab, setTab] = useState<"all" | "unread" | "preferences">(
    searchParams.get("tab") === "preferences" ? "preferences" : "all"
  );
  const [category, setCategory] = useState<NotificationType | "all">("all");
  const [busy, setBusy] = useState(false);

  const all = notifications ?? [];

  const filtered = all.filter(
    (n) => (tab === "unread" ? !n.readAt : true) && (category === "all" || n.type === category)
  );

  async function handleMarkAllRead() {
    setBusy(true);
    await markAllRead();
    setBusy(false);
  }

  async function handleMarkRead(id: string) {
    setBusy(true);
    await markRead(id);
    setBusy(false);
  }

  async function handleSavePreferences(next: typeof preferences) {
    setBusy(true);
    await savePreferences(next);
    setBusy(false);
  }

  const tabs = [
    {
      value: "all",
      label: `All${unreadCount > 0 ? ` (${all.length})` : ""}`,
      content: (
        <div className="flex flex-col gap-4">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as NotificationType | "all")}
            aria-label="Filter by category"
            className="max-w-xs"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <NotificationList notifications={filtered} onMarkRead={handleMarkRead} busy={busy} />
          )}
        </div>
      ),
    },
    {
      value: "unread",
      label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
      content: isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <NotificationList notifications={filtered} onMarkRead={handleMarkRead} busy={busy} />
      ),
    },
    {
      value: "preferences",
      label: "Preferences",
      content: preferencesLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <NotificationPreferences
          preferences={preferences}
          onSave={handleSavePreferences}
          busy={busy}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Notifications</h1>
          <p className="mt-1 text-sm text-ink-500">
            Queue, appointment, medical and system updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} disabled={busy}>
            Mark all as read
          </Button>
        )}
      </div>

      <div role="tablist" className="flex gap-1 border-b border-ink-200">
        {tabs.map((item) => (
          <button
            key={item.value}
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value as typeof tab)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.value
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-ink-500 hover:text-ink-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div>{tabs.find((t) => t.value === tab)?.content}</div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
