"use client";

import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictAnnouncements } from "@/features/district-admin/hooks/useDistrictAdminData";
import { AnnouncementComposer } from "@/features/district-admin/components/AnnouncementComposer";
import { AuditTimeline } from "@/features/district-admin/components/AuditTimeline";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { useState, useEffect } from "react";

export default function DistrictAdminAnnouncementsPage() {
  const { admin, districtId } = useDistrictAdmin();
  const { data: announcements, isLoading, error } = useDistrictAnnouncements(districtId ?? "ernakulam");

  if (isLoading || !districtId) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error || !announcements) {
    return <ErrorState message={error ?? "Unable to load announcements."} onRetry={() => { }} />;
  }

  const { rows, columns } = announcements;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`District Announcements - ${admin?.name ?? "District Admin"}`}
        description="Publish and view district-wide announcements"
      />

      <AnnouncementComposer districtId={districtId ?? "ernakulam"} />

      <AuditTimeline items={rows} columns={columns} />
    </div>
  );
}