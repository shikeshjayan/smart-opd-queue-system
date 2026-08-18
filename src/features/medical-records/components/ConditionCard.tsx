import { Badge } from "@/components/ui/badge";
import type { ConditionStatus } from "../types/medical-record.types";
import { conditionStatusLabel } from "../utils/format";

const statusVariant: Record<ConditionStatus, "default" | "success" | "warning"> = {
  active: "warning",
  resolved: "success",
  inactive: "default",
  unknown: "default",
};

export function ConditionCard({ name, status, since }: {
  name: string;
  status: ConditionStatus;
  since?: string;
}) {
  return (
    <li className="rounded-card border border-ink-200 bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-ink-900">{name}</p>
        <Badge variant={statusVariant[status]}>{conditionStatusLabel(status)}</Badge>
      </div>
      {since && <p className="mt-1 text-xs text-ink-500">Since {since}</p>}
    </li>
  );
}