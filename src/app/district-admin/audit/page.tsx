"use client";

import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictAudit } from "@/features/district-admin/hooks/useDistrictAdminData";
import { AuditTimeline } from "@/features/district-admin/components/AuditTimeline";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function DistrictAdminAuditPage() {
  const { admin, districtId } = useDistrictAdmin();
  const { data: audit, isLoading, error } = useDistrictAudit(districtId ?? "ernakulam");

  if (isLoading || !districtId) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error || !audit) {
    return <ErrorState message={error ?? "Unable to load audit data."} onRetry={() => { }} />;
  }

  const rows = audit.map((e) => ({
    id: e.id,
    at: e.at,
    actorName: e.actorName,
    actorRole: e.actorRole,
    action: e.action,
    targetType: e.targetType,
    targetId: e.targetId,
    summary: e.summary,
  }));
  const columns = [
    { field: "actorName" as const, header: "Actor" },
    { field: "action" as const, header: "Action" },
    { field: "summary" as const, header: "Summary" },
    { field: "at" as const, header: "Time" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`District Audit Trail - ${admin?.name ?? "District Admin"}`}
        description="View audit events and activity log"
      />

      <AuditTimeline items={rows} columns={columns} />
    </div>
  );
}
