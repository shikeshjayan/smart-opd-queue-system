import { tokenService } from "@/services/token";
import type {
  NotificationItem,
  PatientDashboard,
  PatientStat,
  QuickAction,
} from "../types/patient.types";

const quickActions: QuickAction[] = [
  { id: "token", label: "Get OPD Token", description: "Book a token at a government hospital", href: "/patient/hospitals" },
  { id: "history", label: "Medical History", description: "View past visits and encounters", href: "/patient/history" },
  { id: "prescriptions", label: "Prescriptions", description: "Access your e-prescriptions", href: "/patient/prescriptions" },
  { id: "lab", label: "Lab Reports", description: "Download lab results", href: "/patient/lab-reports" },
];

const notifications: NotificationItem[] = [
  { id: "notif_001", message: "Your appointment is approaching. Your token A-047 is being served.", type: "warning", time: "2 min ago" },
  { id: "notif_002", message: "Your last visit was on 10 Aug 2026. Visit history updated.", type: "info", time: "1 day ago" },
];

const stats: PatientStat[] = [
  { id: "visits", label: "Total Visits", value: "12" },
  { id: "tokens", label: "Tokens This Month", value: "3" },
  { id: "last-visit", label: "Last Visit", value: "10 Aug" },
];

export const patientMockApi = {
  async getDashboard(patientId: string): Promise<PatientDashboard> {
    const activeToken = await tokenService.getActive(patientId);
    return {
      patientName: "Demo Patient",
      activeToken,
      stats,
      quickActions,
      notifications,
    };
  },
};
