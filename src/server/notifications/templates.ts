import { t, type Locale } from "@/lib/i18n";

export type NotificationCategory =
  | "appointment"
  | "queue"
  | "clinical"
  | "followup"
  | "announcement"
  | "system";

export type NotificationChannel = "in_app" | "sms" | "push" | "email";

export interface TemplateDefinition {
  titleKey: string;
  bodyKey: string;
  category: NotificationCategory;
  priority: "normal" | "important" | "critical";
  /** Channels this template is delivered through (in_app always included at send time). */
  channels: Exclude<NotificationChannel, "in_app">[];
  /**
   * Policy-required communication — bypasses patient preference opt-outs.
   * e.g. critical result alerts to clinicians, same-day cancellations.
   */
  required?: boolean;
  /** Deep link builder from render params; returns app path or undefined. */
  deepLink?: (params: Record<string, string>) => string | undefined;
}

/**
 * Central template registry (§11). Text is NEVER hard-coded at call sites;
 * bodies resolve from locales/{en,ml}/common.json via t().
 * Privacy rule (§5, §22): sms/push/email bodies come only from these templates.
 * Callers must not interpolate clinical values into params for external
 * channels — keep params limited to operational fields (ids, names of
 * departments/hospitals, dates, times).
 */
export const TEMPLATES: Record<string, TemplateDefinition> = {
  APPOINTMENT_BOOKED: {
    titleKey: "appointment.booked_title",
    bodyKey: "appointment.booked_body",
    category: "appointment",
    priority: "normal",
    channels: ["push"],
    deepLink: (p) => `/patient/appointments/${p.appointmentId}`,
  },
  APPOINTMENT_CONFIRMED: {
    titleKey: "appointment.confirmed_title",
    bodyKey: "appointment.confirmed_body",
    category: "appointment",
    priority: "normal",
    channels: ["sms", "push"],
    deepLink: (p) => `/patient/appointments/${p.appointmentId}`,
  },
  APPOINTMENT_CANCELLED: {
    titleKey: "appointment.cancelled_title",
    bodyKey: "appointment.cancelled_body",
    category: "appointment",
    priority: "important",
    channels: ["sms", "push"],
    required: true,
    deepLink: () => "/patient/appointments",
  },
  APPOINTMENT_RESCHEDULED: {
    titleKey: "appointment.rescheduled_title",
    bodyKey: "appointment.rescheduled_body",
    category: "appointment",
    priority: "important",
    channels: ["sms", "push"],
    required: true,
    deepLink: (p) => `/patient/appointments/${p.appointmentId}`,
  },
  APPOINTMENT_REMINDER: {
    titleKey: "appointment.reminder_title",
    bodyKey: "appointment.reminder_body",
    category: "appointment",
    priority: "normal",
    channels: ["sms", "push"],
    deepLink: (p) => `/patient/appointments/${p.appointmentId}`,
  },
  QUEUE_CHECKED_IN: {
    titleKey: "queue.checked_in_title",
    bodyKey: "queue.checked_in_body",
    category: "queue",
    priority: "normal",
    channels: ["push"],
    deepLink: () => "/patient/queue",
  },
  QUEUE_TOKEN_GENERATED: {
    titleKey: "queue.token_generated_title",
    bodyKey: "queue.token_generated_body",
    category: "queue",
    priority: "normal",
    channels: [],
    deepLink: () => "/patient/queue",
  },
  QUEUE_TOKEN_APPROACHING: {
    titleKey: "queue.approaching_title",
    bodyKey: "queue.approaching_body",
    category: "queue",
    priority: "important",
    channels: ["push"],
    deepLink: () => "/patient/queue",
  },
  QUEUE_TOKEN_CALLED: {
    titleKey: "queue.called_title",
    bodyKey: "queue.called_body",
    category: "queue",
    priority: "critical",
    channels: ["sms", "push"],
    required: true,
    deepLink: () => "/patient/queue",
  },
  QUEUE_DELAYED: {
    titleKey: "queue.delayed_title",
    bodyKey: "queue.delayed_body",
    category: "queue",
    priority: "important",
    channels: ["push"],
    required: true,
    deepLink: () => "/patient/queue",
  },
  LAB_RESULT_AVAILABLE: {
    titleKey: "results.lab_available_title",
    bodyKey: "results.lab_available_body",
    category: "clinical",
    priority: "normal",
    channels: ["push"],
    deepLink: (p) => `/patient/lab-reports/${p.orderId}`,
  },
  DIAGNOSTIC_REPORT_AVAILABLE: {
    titleKey: "results.diagnostic_available_title",
    bodyKey: "results.diagnostic_available_body",
    category: "clinical",
    priority: "normal",
    channels: ["push"],
    deepLink: (p) => `/patient/lab-reports/${p.orderId}`,
  },
  RESULT_READY_FOR_REVIEW: {
    titleKey: "results.result_ready_for_review_title",
    bodyKey: "results.result_ready_for_review_body",
    category: "clinical",
    priority: "important",
    channels: [],
    deepLink: () => "/lab/results",
  },
  CRITICAL_RESULT_ALERT: {
    titleKey: "results.critical_result_title",
    bodyKey: "results.critical_result_body",
    category: "clinical",
    priority: "critical",
    channels: ["push"],
    required: true,
    deepLink: (p) => `/lab/orders/${p.orderId}`,
  },
  PRESCRIPTION_READY: {
    titleKey: "pharmacy.prescription_ready_title",
    bodyKey: "pharmacy.prescription_ready_body",
    category: "clinical",
    priority: "normal",
    channels: ["push"],
    deepLink: () => "/patient/prescriptions",
  },
  PRESCRIPTION_PARTIALLY_DISPENSED: {
    titleKey: "pharmacy.partially_dispensed_title",
    bodyKey: "pharmacy.partially_dispensed_body",
    category: "clinical",
    priority: "normal",
    channels: ["push"],
    deepLink: () => "/patient/prescriptions",
  },
  PRESCRIPTION_DISPENSED: {
    titleKey: "pharmacy.dispensed_title",
    bodyKey: "pharmacy.dispensed_body",
    category: "clinical",
    priority: "normal",
    channels: ["push"],
    deepLink: () => "/patient/prescriptions",
  },
  LOW_STOCK_ALERT: {
    titleKey: "pharmacy.low_stock_title",
    bodyKey: "pharmacy.low_stock_body",
    category: "system",
    priority: "important",
    channels: [],
    deepLink: () => "/pharmacy/inventory",
  },
  FOLLOW_UP_SCHEDULED: {
    titleKey: "followup.scheduled_title",
    bodyKey: "followup.scheduled_body",
    category: "followup",
    priority: "normal",
    channels: ["push"],
    deepLink: () => "/patient/appointments/book",
  },
  FOLLOW_UP_REMINDER: {
    titleKey: "followup.reminder_title",
    bodyKey: "followup.reminder_body",
    category: "followup",
    priority: "normal",
    channels: ["sms", "push"],
    deepLink: () => "/patient/appointments",
  },
  HOSPITAL_ANNOUNCEMENT: {
    titleKey: "announcement.title",
    bodyKey: "announcement.body",
    category: "announcement",
    priority: "important",
    channels: ["push", "email"],
    required: true,
    deepLink: () => "/patient/dashboard",
  },
  STAFF_LEAVE_APPROVED: {
    titleKey: "staff.leave_approved_title",
    bodyKey: "staff.leave_approved_body",
    category: "system",
    priority: "normal",
    channels: [],
    deepLink: (p) => `/hospital-admin/staff/${p.staffId}`,
  },
};

/** Preference group each template belongs to (§23 mapping). */
export function preferenceGroupFor(templateKey: string):
  | "appointmentReminders"
  | "queueUpdates"
  | "resultNotifications"
  | "prescriptionNotifications"
  | "followUpReminders"
  | "announcements"
  | null {
  if (templateKey.startsWith("APPOINTMENT")) return "appointmentReminders";
  switch (templateKey) {
    case "QUEUE_TOKEN_CALLED":
    case "QUEUE_TOKEN_APPROACHING":
    case "QUEUE_DELAYED":
      return "queueUpdates";
    case "LAB_RESULT_AVAILABLE":
    case "DIAGNOSTIC_REPORT_AVAILABLE":
      return "resultNotifications";
    case "PRESCRIPTION_READY":
    case "PRESCRIPTION_PARTIALLY_DISPENSED":
    case "PRESCRIPTION_DISPENSED":
      return "prescriptionNotifications";
    case "FOLLOW_UP_SCHEDULED":
    case "FOLLOW_UP_REMINDER":
      return "followUpReminders";
    case "HOSPITAL_ANNOUNCEMENT":
      return "announcements";
    default:
      return null;
  }
}

export interface RenderedTemplate {
  title: string;
  bodyEn: string;
  bodyMl: string;
  category: NotificationCategory;
  priority: TemplateDefinition["priority"];
  channels: NotificationChannel[];
  required: boolean;
  deepLink?: string;
}

export function renderTemplate(
  templateKey: string,
  locale: Locale,
  params: Record<string, string | number>,
  extraChannels: NotificationChannel[] = []
): RenderedTemplate | undefined {
  const def = TEMPLATES[templateKey];
  if (!def) return undefined;
  const deepLink = def.deepLink?.(params as Record<string, string>);
  return {
    title: t(locale, def.titleKey),
    bodyEn: t("en", def.bodyKey, params),
    bodyMl: t("ml", def.bodyKey, params),
    category: def.category,
    priority: def.priority,
    channels: Array.from(new Set(["in_app", ...def.channels, ...extraChannels])),
    required: Boolean(def.required),
    deepLink,
  };
}
