import { getPatient, listEncounters } from "@/server/actions/patients";
import type {
  NotificationItem,
  PatientDashboard,
  PatientStat,
  QuickAction,
} from "../types/patient.types";

const quickActions: QuickAction[] = [
  { id: "token", label: "Get OPD Token", description: "Book a token at a government hospital", href: "/patient/hospitals" },
  { id: "appointments", label: "Appointments", description: "Book and view appointments", href: "/patient/appointments" },
  { id: "history", label: "Medical History", description: "View past visits and encounters", href: "/patient/history" },
  { id: "prescriptions", label: "Prescriptions", description: "Access your e-prescriptions", href: "/patient/prescriptions" },
  { id: "lab", label: "Lab Reports", description: "Download lab results", href: "/patient/lab-reports" },
];

export const patientMockApi = {
  async getDashboard(patientId: string): Promise<PatientDashboard> {
    const patient = await getPatient(patientId);
    const encounters = await listEncounters(patientId);
    const completedVisits = encounters.filter((e) => e.status === "completed").length;
    const lastVisit = encounters[0];

    const stats: PatientStat[] = [
      { id: "visits", label: "Total Visits", value: String(completedVisits || 0) },
      { id: "last-visit", label: "Last Visit", value: lastVisit ? new Date(lastVisit.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "None" },
    ];

    const notifications: NotificationItem[] = lastVisit
      ? [{ id: "notif_latest", message: `Your last visit was on ${new Date(lastVisit.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`, type: "info", time: "recent" }]
      : [];

    return {
      patientName: patient?.name ?? "Patient",
      activeToken: null,
      stats,
      quickActions,
      notifications,
    };
  },
};
