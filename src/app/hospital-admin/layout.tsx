import type { ReactNode } from "react";
import { HospitalAdminShell } from "@/features/hospital-admin/components/HospitalAdminShell";

export default function HospitalAdminLayout({ children }: { children: ReactNode }) {
  return <HospitalAdminShell>{children}</HospitalAdminShell>;
}
