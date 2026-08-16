"use client";

import type { ReactNode } from "react";
import { HospitalAdminProvider } from "../hospital-context";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export function HospitalAdminShell({ children }: { children: ReactNode }) {
  return (
    <HospitalAdminProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        </div>
      </div>
    </HospitalAdminProvider>
  );
}
