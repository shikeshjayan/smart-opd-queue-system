export type NotificationType = "queue" | "appointment" | "system" | "medical";

export type NotificationPriority = "normal" | "important" | "critical";

export type NotificationChannel = "in_app" | "sms" | "push";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string;
};

export type QueueNotification = Notification & {
  type: "queue";
  tokenId?: string;
  tokenNumber?: string;
  priority: NotificationPriority;
};

export type NotificationEventKey =
  | "queue_updates"
  | "token_approaching"
  | "token_called"
  | "appointment_reminder";

export type NotificationPreferences = Record<NotificationEventKey, Record<NotificationChannel, boolean>>;

export const SUPPORTED_CHANNELS: NotificationChannel[] = ["in_app", "sms", "push"];

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  queue_updates: { in_app: true, sms: false, push: false },
  token_approaching: { in_app: true, sms: false, push: false },
  token_called: { in_app: true, sms: false, push: false },
  appointment_reminder: { in_app: true, sms: false, push: false },
};

export const EVENT_LABELS: Record<NotificationEventKey, { label: string; description: string }> = {
  queue_updates: { label: "Queue Updates", description: "Position changes and general queue movement." },
  token_approaching: { label: "Token Approaching", description: "Alert when your turn is a few patients away." },
  token_called: { label: "Token Called", description: "Alert when your token has been called." },
  appointment_reminder: { label: "Appointment Reminder", description: "Reminders for scheduled appointments." },
};
