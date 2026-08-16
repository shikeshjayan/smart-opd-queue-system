import type { TokenBundle } from "@/types";

export type QuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
};

export type NotificationItem = {
  id: string;
  message: string;
  type: "info" | "warning" | "success";
  time: string;
};

export type PatientStat = {
  id: string;
  label: string;
  value: string;
};

export type PatientDashboard = {
  patientName: string;
  activeToken: TokenBundle | null;
  stats: PatientStat[];
  quickActions: QuickAction[];
  notifications: NotificationItem[];
};
