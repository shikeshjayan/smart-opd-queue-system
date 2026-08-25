import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/components/RoleGuard";

export default function DiagnosticsLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["lab_staff", "lab_reviewer", "hospital_admin"]}>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mb-4">
          <h1 className="text-lg font-bold">Diagnostics Department</h1>
          <p className="text-sm text-muted-foreground">Scheduling, procedure tracking, and reports</p>
        </div>
        {children}
      </main>
    </RoleGuard>
  );
}
