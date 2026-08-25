export type NotificationCategory = "appointment" | "queue" | "clinical" | "followup" | "announcement" | "system";

export type NotificationPriority = "normal" | "important" | "critical";

export type NotificationChannel = "in_app" | "sms" | "push" | "email";

/** Server notification document shape (matches NotificationModel). */
export interface Notification {
  id: string;
  userId: string;
  hospitalId?: string;
  audience: "patient" | "staff" | "hospital";
  templateKey: string;
  category: NotificationCategory;
  title: string;
  message: string;
  bodyEn?: string;
  bodyMl?: string;
  locale?: string;
  priority: NotificationPriority;
  required?: boolean;
  read: boolean;
  readAt?: string;
  deepLink?: string;
  resourceType?: string;
  resourceId?: string;
  channels?: NotificationChannel[];
  sentBy?: string;
  createdAt: string;
}

/** Server delivery record shape. */
export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  state: "pending" | "processing" | "sent" | "delivered" | "failed" | "read";
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  providerMessageId?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
}

/** Server preference shape (NotificationPreferenceModel). */
export interface NotificationPreference {
  patientId: string;
  sms: boolean;
  email: boolean;
  push: boolean;
  appointmentReminders: boolean;
  queueUpdates: boolean;
  resultNotifications: boolean;
  prescriptionNotifications: boolean;
  followUpReminders: boolean;
  announcements: boolean;
  locale: string;
  phoneVerified: boolean;
}

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  appointment: "Appointment",
  queue: "Queue",
  clinical: "Clinical",
  followup: "Follow-up",
  announcement: "Announcement",
  system: "System",
};

export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  normal: "Normal",
  important: "Important",
  critical: "Critical",
};
