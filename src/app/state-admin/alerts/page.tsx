"use client";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { StateAlertsPanel } from "@/features/state-admin/components/StateAlertsPanel";

export default function StateAlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="State Alerts"
        description="State-wide operational alerts"
      />
      <StateAlertsPanel />
    </div>
  );
}
