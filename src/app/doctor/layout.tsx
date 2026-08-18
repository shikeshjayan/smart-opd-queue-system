import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/components/RoleGuard";
import { DoctorHeader } from "@/features/doctor/components/DoctorHeader";

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["doctor"]} expiredMode="inline">
      <DoctorHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </RoleGuard>
  );
}