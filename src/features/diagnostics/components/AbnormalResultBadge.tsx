import { Badge } from "@/components/ui/badge";
import type { ResultFlag } from "@/services/diagnostics/types";

export function AbnormalResultBadge({ flag }: { flag: ResultFlag }) {
  if (flag === "high")
    return <Badge variant="warning">High ▴</Badge>;
  if (flag === "low")
    return <Badge variant="warning">Low ▾</Badge>;
  if (flag === "normal")
    return <Badge variant="success">Within range</Badge>;
  return null;
}

export function abnormalFlagLabel(flag: ResultFlag): string | null {
  if (flag === "high") return "Outside reference range (high)";
  if (flag === "low") return "Outside reference range (low)";
  if (flag === "normal") return "Within reference range";
  return null;
}