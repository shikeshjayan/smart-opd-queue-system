import type { OPDToken } from "@/features/registration/types/registration.types";
import { formatDate } from "@/features/medical-records/utils/format";
import { TokenStatus } from "./TokenStatus";

export function TokenCard({ token, actions }: { token: OPDToken; actions?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-lg font-bold tabular-nums text-ink-900">
            {token.tokenNumber}
          </p>
          <p className="mt-0.5 font-medium text-ink-900">{token.patientName}</p>
          <p className="text-sm text-ink-500">
            {token.departmentName} &middot; {token.opdName}
          </p>
          <p className="text-xs text-ink-400">
            {formatDate(token.createdAt.slice(0, 10))} &middot;{" "}
            {token.createdAt.slice(11, 16)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TokenStatus status={token.status} />
          {actions}
        </div>
      </div>
    </div>
  );
}