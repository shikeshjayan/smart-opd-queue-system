"use client"
import { PageHeader } from "@/features/hospital-admin/components/PageHeader"
import { UserManagementTable } from "@/features/state-admin/components/UserManagementTable"

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="State User Management"
        description="Manage users across Kerala"
      />
      <UserManagementTable />
    </div>
  )
}
