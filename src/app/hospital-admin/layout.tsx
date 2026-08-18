import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/components/RoleGuard";
import { HospitalAdminShell } from "@/features/hospital-admin/components/HospitalAdminShell";

export default function HospitalAdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["hospital_admin"]}>
      <HospitalAdminShell>{children}</HospitalAdminShell>
    </RoleGuard>
  );
}
