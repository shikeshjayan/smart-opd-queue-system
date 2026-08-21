import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentAuditEntry } from "../types/medical-document.types";
import { formatDateTime } from "../utils/format";

const ACTION_LABEL: Record<DocumentAuditEntry["action"], string> = {
  uploaded: "Uploaded",
  viewed: "Viewed",
  downloaded: "Downloaded",
  metadata_updated: "Metadata updated",
  archived: "Archived",
  restored: "Restored",
  amended: "Amended",
};

const ACTION_VARIANT: Record<DocumentAuditEntry["action"], "default" | "info" | "warning" | "success"> = {
  uploaded: "success",
  viewed: "info",
  downloaded: "info",
  metadata_updated: "default",
  archived: "warning",
  restored: "success",
  amended: "warning",
};

export function DocumentAudit({ entries, loading }: { entries: DocumentAuditEntry[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }
  if (entries.length === 0) {
    return <p className="text-sm text-ink-500">No activity recorded yet.</p>;
  }
  return (
    <ol className="flex max-h-56 flex-col gap-2 overflow-auto">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge variant={ACTION_VARIANT[entry.action]}>{ACTION_LABEL[entry.action]}</Badge>
            <p className="mt-1 truncate text-xs text-ink-500">
              {entry.byName} · {entry.byRole.replace("_", " ")}
            </p>
            {entry.note && <p className="mt-0.5 text-xs text-ink-400">{entry.note}</p>}
          </div>
          <time className="shrink-0 text-xs text-ink-400" dateTime={entry.at}>
            {formatDateTime(entry.at)}
          </time>
        </li>
      ))}
    </ol>
  );
}