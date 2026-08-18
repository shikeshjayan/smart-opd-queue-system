import type { OPDToken, OPDTokenStatus } from "@/features/registration/types/registration.types";
import { TokenStatus } from "./TokenStatus";

type TokenSummaryProps = {
  tokens: OPDToken[];
};

export function TokenSummary({ tokens }: TokenSummaryProps) {
  const statuses: OPDTokenStatus[] = [
    "waiting",
    "called",
    "in_consultation",
    "completed",
    "cancelled",
    "skipped",
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => {
        const count = tokens.filter((t) => t.status === status).length;
        if (count === 0) return null;
        return (
          <div
            key={status}
            className="flex items-center gap-2 rounded-card border border-ink-200 bg-surface px-3 py-2 shadow-card"
          >
            <TokenStatus status={status} />
            <span className="font-bold tabular-nums text-ink-900">{count}</span>
          </div>
        );
      })}
    </div>
  );
}