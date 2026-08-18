"use client";

import { Button } from "@/components/ui/button";
import { usePermissions } from "@/features/auth/hooks/useAuth";

export function ExportActions() {
  const { can } = usePermissions();
  const allowed = can("VIEW_REPORTS") && can("EXPORT_REPORTS");

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={!allowed}
        title={allowed ? "Export CSV" : "You don't have permission to export reports"}
      >
        Export CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={!allowed}
        title={allowed ? "Export PDF" : "You don't have permission to export reports"}
      >
        Export PDF
      </Button>
    </div>
  );
}