"use client";

import type { TrendPoint } from "../types/state-admin.types";

type TrendChartProps = {
  title: string;
  data: TrendPoint[];
};

export function TrendChart({ title, data }: TrendChartProps) {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <section aria-label={title} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <h3 className="mb-4 font-semibold text-ink-900">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-ink-500">No trend data available.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {data.map((point) => (
            <li key={point.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-xs text-ink-500">{point.label}</span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${Math.round((point.value / max) * 100)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-xs font-medium text-ink-900">
                {point.value.toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
