import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/components/RoleGuard";
import { LabHeader } from "@/features/lab/components/LabHeader";

export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["lab_staff", "lab_reviewer", "hospital_admin"]}>
      <LabHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </RoleGuard>
  );
}