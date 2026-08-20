import type { ResultValue } from "@/services/diagnostics/types";
import { AbnormalResultBadge } from "./AbnormalResultBadge";

export function ResultTable({ values }: { values: ResultValue[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
            <th scope="col" className="py-2 pr-4 font-medium">Result</th>
            <th scope="col" className="py-2 pr-4 font-medium">Value</th>
            <th scope="col" className="py-2 pr-4 font-medium">Unit</th>
            <th scope="col" className="py-2 pr-4 font-medium">Reference</th>
            <th scope="col" className="py-2 font-medium">Flag</th>
          </tr>
        </thead>
        <tbody>
          {values.map((value) => (
            <tr key={value.parameterKey} className="border-b border-ink-100 last:border-b-0">
              <td className="py-2 pr-4 font-medium text-ink-900">{value.name}</td>
              <td className="py-2 pr-4 tabular-nums text-ink-700">{value.value || "—"}</td>
              <td className="py-2 pr-4 text-ink-500">{value.unit ?? "—"}</td>
              <td className="py-2 pr-4 text-ink-500">
                {value.refText ?? (value.refLow !== undefined || value.refHigh !== undefined
                  ? `${value.refLow ?? "≤"} – ${value.refHigh ?? "≥"}${value.unit ? ` ${value.unit}` : ""}`
                  : "—")}
              </td>
              <td className="py-2">
                <AbnormalResultBadge flag={value.flag} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}