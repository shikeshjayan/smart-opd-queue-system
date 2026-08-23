"use client"
import { PageHeader } from "@/features/hospital-admin/components/PageHeader"
import { ConfigManager } from "@/features/state-admin/components/ConfigManager"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="State Configuration"
        description="System-wide settings and configuration"
      />
      <ConfigManager />
      
      <div className="mt-8 p-6 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Emergency Controls</h3>
        <form className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">State-wide Emergency Mode</div>
              <div className="text-sm text-muted-foreground">
                Activate to prioritize emergency services across all hospitals
              </div>
            </div>
            <input type="checkbox" className="w-6 h-6" />
          </div>
        </form>
      </div>
    </div>
  )
}
