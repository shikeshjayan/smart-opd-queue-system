import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/components/RoleGuard";
import { PatientHeader } from "@/features/patient/components/PatientHeader";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["patient"]}>
      <PatientHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </RoleGuard>
  );
}