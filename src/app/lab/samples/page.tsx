"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { redirect } from "next/navigation";

export default function LabSamplesPage() {
  const { user, status } = useAuth();

  if (status === "loading") return <div>Loading...</div>;
  if (!user || (user.role !== "lab_staff" && user.role !== "hospital_admin" && user.role !== "lab_reviewer")) {
    return <div className="p-4">Access denied.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sample Tracking</h1>
      <p className="text-sm text-muted-foreground">
        All collected samples with their SMP IDs. Click an order to view sample details.
      </p>
    </div>
  );
}