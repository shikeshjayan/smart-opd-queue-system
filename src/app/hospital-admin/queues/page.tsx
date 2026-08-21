"use client";

import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminDepartments } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { useTokenConfig } from "@/features/hospital-admin/hooks/useHospitalOps";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { QueueMonitor } from "@/features/hospital-admin/components/QueueMonitor";
import { QueueSettingsForm } from "@/features/hospital-admin/components/QueueSettingsForm";
import { TokenSettingsForm } from "@/features/hospital-admin/components/TokenSettingsForm";
import { Tabs } from "@/components/ui/tabs";

export default function QueuesPage() {
  const { hospitalId } = useHospitalAdmin();
  const { data: tokenConfig, isLoading: tokenLoading } = useTokenConfig(hospitalId);
  const { data: departments, isLoading: departmentsLoading } = useAdminDepartments(hospitalId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Queues"
        description="Live OPD queue monitoring and queue/token configuration."
      />
      <Tabs
        tabs={[
          { value: "live", label: "Live Monitor", content: <QueueMonitor /> },
          {
            value: "settings",
            label: "Queue Settings",
            content:
              departmentsLoading ? null : (
                <QueueSettingsForm
                  hospitalId={hospitalId}
                  departments={(departments ?? []).map((d) => ({ id: d.id, name: d.name }))}
                />
              ),
          },
          {
            value: "tokens",
            label: "Token Settings",
            content: (
              <TokenSettingsForm
                hospitalId={hospitalId}
                config={tokenConfig ?? undefined}
                isLoading={tokenLoading}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
