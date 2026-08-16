import { Button } from "@/components/ui/button";

export function ExportActions() {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" disabled title="Export is not available in this demo yet">
        Export CSV
      </Button>
      <Button type="button" variant="outline" disabled title="Export is not available in this demo yet">
        Export PDF
      </Button>
    </div>
  );
}
