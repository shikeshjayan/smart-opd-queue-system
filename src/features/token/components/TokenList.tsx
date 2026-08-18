import type { OPDToken } from "@/features/registration/types/registration.types";
import { TokenCard } from "./TokenCard";
import { TokenStatus } from "./TokenStatus";

type TokenListProps = {
  tokens: OPDToken[];
  actions?: (token: OPDToken) => React.ReactNode;
};

export function TokenList({ tokens, actions }: TokenListProps) {
  if (tokens.length === 0) return null;

  return (
    <>
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Token</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Patient</th>
                <th scope="col" className="px-4 py-2.5 font-medium">OPD</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Time</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {tokens.map((token) => (
                <tr key={token.id}>
                  <td className="px-4 py-2.5 font-mono font-semibold tabular-nums text-ink-900">
                    {token.tokenNumber}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-ink-900">{token.patientName}</td>
                  <td className="px-4 py-2.5 text-ink-700">
                    {token.departmentName}
                    <span className="text-ink-400"> · {token.opdName}</span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-ink-500">
                    {token.createdAt.slice(11, 16)}
                  </td>
                  <td className="px-4 py-2.5">
                    <TokenStatus status={token.status} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">{actions?.(token)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {tokens.map((token) => (
          <li key={token.id}>
            <TokenCard token={token} actions={actions?.(token)} />
          </li>
        ))}
      </ul>
    </>
  );
}