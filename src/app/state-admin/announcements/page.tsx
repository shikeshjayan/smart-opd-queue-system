"use client"
import { PageHeader } from "@/features/hospital-admin/components/PageHeader"
import { AnnouncementManager } from "@/features/state-admin/components/AnnouncementManager"

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="State Announcements"
        description="Publish and manage state-wide announcements"
      />
      <AnnouncementManager />
    </div>
  )
}
