import type { Notification, NotificationType } from "../types/notification.types";
import { timeAgo } from "../utils/format";
import { Badge } from "@/components/ui/badge";

const typeConfig: Record<NotificationType, { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  queue: { label: "Queue", variant: "info" },
  appointment: { label: "Appointment", variant: "success" },
  system: { label: "System", variant: "default" },
  medical: { label: "Medical", variant: "warning" },
};

type NotificationItemProps = {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  busy?: boolean;
};

export function NotificationItem({ notification, onMarkRead, busy = false }: NotificationItemProps) {
  const { label, variant } = typeConfig[notification.type];
  const unread = !notification.readAt;

  return (
    <li
      className={`flex flex-wrap items-start justify-between gap-3 rounded-card border bg-surface p-4 shadow-card ${
        unread ? "border-brand-200" : "border-ink-200 opacity-70"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant={variant}>{label}</Badge>
          {"priority" in notification && notification.priority === "critical" && (
            <Badge variant="danger">Critical</Badge>
          )}
          {unread && <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />}
          <p className="text-sm font-semibold text-ink-900">{notification.title}</p>
        </div>
        <p className="mt-1 text-sm text-ink-700">{notification.message}</p>
        <p className="mt-1 text-xs text-ink-400">{timeAgo(notification.createdAt)}</p>
      </div>
      {unread && onMarkRead && (
        <button
          type="button"
          onClick={() => onMarkRead(notification.id)}
          disabled={busy}
          className="rounded-btn border border-ink-300 px-2.5 py-1 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-100 disabled:opacity-50"
        >
          Mark read
        </button>
      )}
    </li>
  );
}
