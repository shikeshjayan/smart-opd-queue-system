import type { AdminNotification, AdminSettings, Hospital } from "@/types";
import type { AdminDashboardData, HospitalStats, QueueOverviewItem } from "@/services/admin/types";

export type HospitalAdminContextValue = {
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  hospitals: Hospital[];
  hospitalId: string;
  hospital: Hospital | null;
  loading: boolean;
  setHospitalId: (id: string) => void;
};

export type AdminNavItem = {
  href: string;
  label: string;
};

export type { AdminDashboardData, AdminNotification, AdminSettings, HospitalStats, QueueOverviewItem };
