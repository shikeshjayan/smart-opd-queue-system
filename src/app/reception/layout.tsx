import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/components/RoleGuard";
import { ReceptionHeader } from "@/features/registration/components/ReceptionHeader";
import { ReceptionProvider } from "@/features/registration/reception-context";
import { ReceptionShortcuts } from "./shortcuts";

export default function ReceptionLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["receptionist"]}>
      <ReceptionProvider>
        <ReceptionShortcuts />
        <ReceptionHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      </ReceptionProvider>
    </RoleGuard>
  );
}