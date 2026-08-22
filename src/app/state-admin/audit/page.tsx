"use client"
import { PageHeader } from "@/features/hospital-admin/components/PageHeader"
import { AuditLog } from "@/features/state-admin/components/AuditLog"

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="State Audit Log"
        description="Track administrative actions across the state"
      />
      <AuditLog />
    </div>
  )
}
