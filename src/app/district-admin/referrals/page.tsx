"use client";

import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictReferrals } from "@/features/district-admin/hooks/useDistrictAdminData";
import { ReferralSummary } from "@/features/district-admin/components/ReferralSummary";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import type { ReferralFlow } from "@/features/district-admin/types/district-admin.types";

export default function DistrictAdminReferralsPage() {
  const { admin, districtId } = useDistrictAdmin();
  const { data: referrals, isLoading, error } = useDistrictReferrals(districtId ?? "ernakulam");

  if (isLoading || !districtId) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error || !referrals) {
    return <ErrorState message={error ?? "Unable to load referrals."} onRetry={() => { }} />;
  }

  const rows = referrals.map((r: ReferralFlow) => ({
    id: r.id,
    fromHospitalId: r.fromHospitalId,
    fromHospitalName: r.fromHospitalName,
    toHospitalId: r.toHospitalId,
    toHospitalName: r.toHospitalName,
    count: r.count,
    periodLabel: r.periodLabel,
  }));
  const columns = [
    { field: "fromHospitalName" as const, header: "From" },
    { field: "toHospitalName" as const, header: "To" },
    { field: "count" as const, header: "Referrals" },
    { field: "periodLabel" as const, header: "Period" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Referral Summary - ${admin?.name ?? "District Admin"}`}
        description="Track patient referrals between hospitals"
      />

      <ReferralSummary rows={rows} columns={columns} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {referrals.map((row: ReferralFlow) => (
          <div
            key={row.id}
            className="rounded-card border border-ink-200 p-4 shadow-card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink-900">{row.fromHospitalName} → {row.toHospitalName}</span>
              <span className="text-sm text-ink-500">{row.count} referrals</span>
            </div>
            <p className="text-xs text-ink-400 mt-1">{row.periodLabel}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
