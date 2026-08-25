import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/components/RoleGuard";

export default function PharmacyLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["pharmacist", "hospital_admin"]}>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mb-4">
          <h1 className="text-lg font-bold">Pharmacy</h1>
          <p className="text-sm text-muted-foreground">Prescriptions, dispensing, and inventory</p>
        </div>
        {children}
      </main>
    </RoleGuard>
  );
}
