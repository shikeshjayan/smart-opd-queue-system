import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/components/RoleGuard";
import { ClinicalHeader } from "@/features/clinical/components/ClinicalHeader";

export default function ClinicalLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["clinical_staff", "hospital_admin"]}>
      <ClinicalHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </RoleGuard>
  );
}
