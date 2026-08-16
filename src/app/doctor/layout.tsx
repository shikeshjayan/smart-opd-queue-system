import type { ReactNode } from "react";
import { DoctorHeader } from "@/features/doctor/components/DoctorHeader";

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DoctorHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
