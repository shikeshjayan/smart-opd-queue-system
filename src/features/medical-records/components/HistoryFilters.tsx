import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { HistoryFacets, HistoryFilters } from "../types/medical-record.types";

type HistoryFiltersProps = {
  filters: HistoryFilters;
  facets: HistoryFacets;
  onChange: (filters: HistoryFilters) => void;
};

export function HistoryFilters({ filters, facets, onChange }: HistoryFiltersProps) {
  function update(patch: Partial<HistoryFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <label className="block min-w-[12rem] flex-1">
        <span className="mb-1 block text-sm font-medium text-ink-700">Search history</span>
        <Input
          type="search"
          placeholder="Diagnosis, reason or doctor"
          value={filters.keyword}
          onChange={(e) => update({ keyword: e.target.value })}
          aria-label="Search medical history"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-700">Year</span>
        <Select
          value={filters.year ?? "all"}
          onChange={(e) => update({ year: e.target.value === "all" ? undefined : e.target.value })}
          aria-label="Filter by year"
        >
          <option value="all">All years</option>
          {facets.years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-700">Hospital</span>
        <Select
          value={filters.hospitalId ?? "all"}
          onChange={(e) => update({ hospitalId: e.target.value === "all" ? undefined : e.target.value })}
          aria-label="Filter by hospital"
        >
          <option value="all">All hospitals</option>
          {facets.hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.name}
            </option>
          ))}
        </Select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-700">Department</span>
        <Select
          value={filters.departmentId ?? "all"}
          onChange={(e) => update({ departmentId: e.target.value === "all" ? undefined : e.target.value })}
          aria-label="Filter by department"
        >
          <option value="all">All departments</option>
          {facets.departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </Select>
      </label>
    </div>
  );
}