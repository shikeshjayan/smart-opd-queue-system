"use client";

import type { DashboardFilters, DashboardDateRange } from "@/services/hospital-ops/types";

type DashboardFiltersBarProps = {
  filters: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
  departments: Array<{ id: string; name: string }>;
  doctors: Array<{ id: string; name: string }>;
};

const DATE_RANGES: Array<{ value: DashboardDateRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const SHIFTS: Array<{ value: DashboardFilters["shift"]; label: string }> = [
  { value: "all", label: "All shifts" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
];

export function DashboardFiltersBar({ filters, onChange, departments, doctors }: DashboardFiltersBarProps) {
  const selectCls =
    "h-10 rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900 focus:outline-2 focus:outline-brand-600";

  return (
    <div
      role="group"
      aria-label="Dashboard filters"
      className="flex flex-wrap items-center gap-3 rounded-card border border-ink-200 bg-surface p-3 shadow-card"
    >
      <label className="flex items-center gap-2 text-sm text-ink-500">
        <span className="sr-only">Date range</span>
        <select
          className={selectCls}
          value={filters.dateRange}
          onChange={(e) => onChange({ ...filters, dateRange: e.target.value as DashboardDateRange })}
        >
          {DATE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-ink-500">
        Department
        <select
          className={selectCls}
          value={filters.departmentId}
          onChange={(e) => onChange({ ...filters, departmentId: e.target.value })}
        >
          <option value="">All</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-ink-500">
        Doctor
        <select
          className={selectCls}
          value={filters.doctorId}
          onChange={(e) => onChange({ ...filters, doctorId: e.target.value })}
        >
          <option value="">All</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-ink-500">
        Shift
        <select
          className={selectCls}
          value={filters.shift}
          onChange={(e) =>
            onChange({ ...filters, shift: e.target.value as DashboardFilters["shift"] })
          }
        >
          {SHIFTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {(filters.departmentId || filters.doctorId || filters.shift !== "all" || filters.dateRange !== "today") && (
        <button
          type="button"
          className="ml-auto text-sm font-medium text-brand-600 hover:underline"
          onClick={() =>
            onChange({ dateRange: "today", departmentId: "", doctorId: "", shift: "all" })
          }
        >
          Reset
        </button>
      )}
    </div>
  );
}
