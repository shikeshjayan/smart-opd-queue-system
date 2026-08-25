import Link from "next/link";
import type { Notification, NotificationCategory, NotificationPriority } from "../types/notification.types";
import { timeAgo } from "../utils/format";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "../types/notification.types";

const categoryVariant: Record<NotificationCategory, "success" | "warning" | "danger" | "info" | "default"> = {
  queue: "info",
  appointment: "success",
  clinical: "warning",
  followup: "default",
  announcement: "info",
  system: "default",
};

type NotificationItemProps = {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  busy?: boolean;
};

export function NotificationItem({ notification, onMarkRead, busy = false }: NotificationItemProps) {
  const unread = !notification.read;
  const category = notification.category ?? "system";
  const label = CATEGORY_LABELS[category] ?? "System";
  const variant = categoryVariant[category] ?? "default";
  const isCritical = notification.priority === "critical";

  const content = (
    <li
      className={`flex flex-wrap items-start justify-between gap-3 rounded-card border bg-surface p-4 shadow-card ${
        unread ? "border-brand-200" : "border-ink-200 opacity-70"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant={variant}>{label}</Badge>
          {isCritical && <Badge variant="danger">Critical</Badge>}
          {unread && <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />}
          <p className="text-sm font-semibold text-ink-900">{notification.title}</p>
        </div>
        <p className="mt-1 text-sm text-ink-700 whitespace-pre-line">{notification.message}</p>
        <p className="mt-1 text-xs text-ink-400">{timeAgo(notification.createdAt)}</p>
      </div>

      <div className="flex items-center gap-2">
        {unread && onMarkRead && (
          <button
            type="button"
            className="rounded-btn bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
            onClick={() => onMarkRead(notification.id)}
            disabled={busy}
          >
            Mark read
          </button>
        )}
      </div>

      {notification.deepLink && (
        <div className="w-full mt-2">
          <Link
            href={notification.deepLink}
            className="text-xs font-medium text-brand-700 hover:underline"
            onClick={() => {
              if (unread && onMarkRead) onMarkRead(notification.id);
            }}
          >
            View details →
          </Link>
        </div>
      )}
    </li>
  );

  if (notification.deepLink && unread) {
    return content;
  }
  return content;
}
