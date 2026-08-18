"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatTime } from "@/features/patient/utils/format";
import type { OPDAvailabilityStatus, OPDRegistration } from "../types/registration.types";

const availabilityConfig: Record<OPDAvailabilityStatus, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  available: { label: "Available", variant: "success" },
  almost_full: { label: "Almost Full", variant: "warning" },
  full: { label: "Full", variant: "danger" },
  not_started: { label: "Not Started", variant: "default" },
  closed: { label: "Closed", variant: "default" },
  doctor_unavailable: { label: "Doctor Unavailable", variant: "warning" },
};

type OPDSelectorProps = {
  opds: OPDRegistration[];
  selectedOpdId?: string;
  isLoading?: boolean;
  onSelect: (opd: OPDRegistration) => void;
};

export function OPDSelector({ opds, selectedOpdId, isLoading, onSelect }: OPDSelectorProps) {
  const departments = useMemo(
    () => [...new Map(opds.map((opd) => [opd.departmentId, opd.departmentName])).entries()],
    [opds]
  );
  const [departmentId, setDepartmentId] = useState("");

  const filtered = departmentId ? opds.filter((opd) => opd.departmentId === departmentId) : opds;

  if (isLoading) {
    return <p className="text-sm text-ink-500">Loading available OPDs...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-700">Department</span>
        <Select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          aria-label="Filter by department"
        >
          <option value="">All departments</option>
          {departments.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </Select>
      </label>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-500">No OPD sessions available for the selected department.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((opd) => {
            const cfg = availabilityConfig[opd.availability];
            const isSelectable =
              opd.availability !== "full" &&
              opd.availability !== "closed" &&
              opd.availability !== "not_started";
            const selected = opd.opdId === selectedOpdId;
            return (
              <li
                key={opd.opdId}
                className={`flex flex-col gap-3 rounded-card border bg-surface p-4 shadow-card ${
                  selected ? "border-brand-600" : "border-ink-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-ink-900">{opd.opdName}</h4>
                    <p className="text-sm text-ink-500">
                      {formatTime(opd.startTime)} – {formatTime(opd.endTime)}
                    </p>
                    <p className="mt-1 text-sm text-ink-700">{opd.doctorName}</p>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-ink-500">Queue: {opd.queueCount} waiting</span>
                  <span className="text-ink-500">
                    Est. wait: {opd.estimatedWaitMinutes != null ? `~${opd.estimatedWaitMinutes} min` : "—"}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-ink-500">
                    <span>Tokens generated</span>
                    <span className="tabular-nums">
                      {opd.generated} / {opd.capacity}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={`h-full rounded-full ${
                        opd.availability === "full"
                          ? "bg-status-danger"
                          : opd.availability === "almost_full"
                            ? "bg-status-warning"
                            : "bg-brand-600"
                      }`}
                      style={{ width: `${Math.min(100, (opd.generated / opd.capacity) * 100)}%` }}
                    />
                  </div>
                </div>

                {opd.availability === "full" ? (
                  <p className="rounded-btn border border-status-danger-soft bg-status-danger-soft px-3 py-2 text-center text-sm text-status-danger">
                    Token limit reached — choose another OPD.
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={!isSelectable}
                    onClick={() => onSelect(opd)}
                    className="h-11 rounded-btn bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {selected ? "Selected" : "Select OPD"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}