import { Badge } from "@/components/ui/badge";
import type { AllergySeverity } from "../types/medical-record.types";

const severityVariant: Record<AllergySeverity, "warning" | "success" | "danger"> = {
  mild: "success",
  moderate: "warning",
  severe: "danger",
};

export function AllergyCard({ substance, reaction, severity, status }: {
  substance: string;
  reaction?: string;
  severity?: AllergySeverity;
  status: "active" | "inactive";
}) {
  return (
    <li className="rounded-card border border-ink-200 bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-ink-900">{substance}</p>
        <Badge variant={status === "active" ? "danger" : "default"}>
          {status === "active" ? "Active" : "Inactive"}
        </Badge>
      </div>
      {reaction && <p className="mt-1 text-sm text-ink-600">Reaction: {reaction}</p>}
      {severity && (
        <p className="mt-0.5 text-xs text-ink-500">
          Severity: <Badge variant={severityVariant[severity]} className="ml-1">{severity}</Badge>
        </p>
      )}
    </li>
  );
}