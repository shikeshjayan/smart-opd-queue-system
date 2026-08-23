"use client"
import { PageHeader } from "@/features/hospital-admin/components/PageHeader"
import { SystemHealthPanel } from "@/features/state-admin/components/SystemHealthPanel"

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Monitor system service health"
      />
      <SystemHealthPanel />
    </div>
  )
}
