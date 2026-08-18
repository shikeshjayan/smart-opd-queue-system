import type { Notification } from "../types/notification.types";
import { NotificationItem } from "./NotificationItem";
import { EmptyState } from "@/components/feedback/empty-state";

type NotificationListProps = {
  notifications: Notification[];
  onMarkRead?: (id: string) => void;
  busy?: boolean;
};

export function NotificationList({ notifications, onMarkRead, busy = false }: NotificationListProps) {
  if (notifications.length === 0) {
    return <EmptyState title="No notifications" description="You're all caught up." />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={onMarkRead}
          busy={busy}
        />
      ))}
    </ul>
  );
}
