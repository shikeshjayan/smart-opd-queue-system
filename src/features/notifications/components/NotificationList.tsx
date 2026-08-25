import type { Notification } from "../types/notification.types";
import { NotificationItem } from "./NotificationItem";
import { EmptyState } from "@/components/feedback/empty-state";

type NotificationListProps = {
  notifications: Notification[];
  onMarkRead?: (id: string) => void;
  emptyMessage?: string;
  busyIds?: Set<string>;
};

export function NotificationList({
  notifications,
  onMarkRead,
  emptyMessage = "No notifications",
  busyIds,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return <EmptyState title="No notifications" description={emptyMessage} />;
  }

  return (
    <ol className="flex flex-col gap-3" role="list" aria-label="Notifications">
      {notifications.map((n) => (
        <NotificationItem
          key={n.id}
          notification={n}
          onMarkRead={onMarkRead}
          busy={busyIds?.has(n.id)}
        />
      ))}
    </ol>
  );
}
