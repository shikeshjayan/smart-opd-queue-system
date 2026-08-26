"use client";

import { useState } from "react";
import { hospitalOpsServerApi } from "../api/hospital-ops.server";
import type { OpsDepartmentConfig } from "@/server/actions/hospital-ops";
import type { Workday } from "@/services/appointments/types";
import { WEEKDAYS } from "@/services/hospital-ops";
import { useAsync } from "@/lib/use-async";
import { useOpsMutations } from "../hooks/useHospitalOps";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type DepartmentConfigDialogProps = {
  open: boolean;
  departmentId: string;
  hospitalId: string;
  onClose: () => void;
  onSaved: () => void;
};

const numLabelCls = "mb-1 block text-xs font-medium text-ink-600";
const numInputCls = "h-10 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm";

function ConfigForm({
  initial,
  services,
  onSaved,
  onClose,
}: {
  initial: OpsDepartmentConfig;
  services: Array<{ id: string; name: string }>;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<OpsDepartmentConfig>(initial);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const { saveDepartmentConfig, busy, error } = useOpsMutations();

  const toggleDay = (day: Workday) => {
    setDraft({
      ...draft,
      opdAvailabilityDays: draft.opdAvailabilityDays.includes(day)
        ? draft.opdAvailabilityDays.filter((d) => d !== day)
        : [...draft.opdAvailabilityDays, day],
    });
    setSavedAt(null);
  };

  const num = (v: string): number | null => {
    if (v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void (async () => {
          const result = await saveDepartmentConfig(draft);
          if (result) {
            onSaved();
            onClose();
          }
        })();
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Name</span>
          <input
            className="h-11 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm"
            value={draft.name}
            required
            onChange={(e) => {
              setDraft({ ...draft, name: e.target.value });
              setSavedAt(null);
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Code</span>
          <input
            className="h-11 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm uppercase"
            maxLength={5}
            value={draft.code}
            placeholder="e.g. CARD"
            onChange={(e) => {
              setDraft({ ...draft, code: e.target.value.toUpperCase() });
              setSavedAt(null);
            }}
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-ink-700">OPD availability</legend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-1.5 rounded-btn border border-ink-200 px-2 py-1 text-xs"
            >
              <input
                type="checkbox"
                checked={draft.opdAvailabilityDays.includes(value)}
                onChange={() => toggleDay(value)}
              />
              {label.slice(0, 3)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-ink-700">Daily capacity &amp; allocation</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={numLabelCls}>Daily capacity (patients)</span>
            <input
              className={numInputCls}
              type="number"
              min={0}
              value={draft.dailyCapacity ?? ""}
              placeholder="e.g. 120"
              onChange={(e) => {
                setDraft({ ...draft, dailyCapacity: num(e.target.value) });
                setSavedAt(null);
              }}
            />
          </label>
          <label className="block">
            <span className={numLabelCls}>Avg consultation (min)</span>
            <input
              className={numInputCls}
              type="number"
              min={1}
              value={draft.avgConsultationMinutes ?? ""}
              placeholder="e.g. 8"
              onChange={(e) => {
                setDraft({ ...draft, avgConsultationMinutes: num(e.target.value) });
                setSavedAt(null);
              }}
            />
          </label>
          <label className="block">
            <span className={numLabelCls}>Appointment allocation %</span>
            <input
              className={numInputCls}
              type="number"
              min={0}
              max={100}
              value={draft.appointmentAllocationPct ?? ""}
              placeholder="e.g. 70"
              onChange={(e) => {
                const v = num(e.target.value);
                setDraft({
                  ...draft,
                  appointmentAllocationPct: v,
                  walkInAllocationPct:
                    v === null ? draft.walkInAllocationPct : Math.max(0, 100 - v),
                });
                setSavedAt(null);
              }}
            />
          </label>
          <label className="block">
            <span className={numLabelCls}>Walk-in allocation %</span>
            <input
              className={numInputCls}
              type="number"
              min={0}
              max={100}
              value={draft.walkInAllocationPct ?? ""}
              readOnly
              tabIndex={-1}
            />
          </label>
        </div>
        <p className="mt-1.5 text-xs text-ink-400">
          Appointment + walk-in shares must total 100%. Changes are versioned in the audit trail.
        </p>
      </fieldset>

      {services.length > 0 && (
        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-ink-700">Linked services</legend>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <label
                key={service.id}
                className="flex items-center gap-1.5 rounded-btn border border-ink-200 px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={draft.serviceIds.includes(service.id)}
                  onChange={() => {
                    setDraft({
                      ...draft,
                      serviceIds: draft.serviceIds.includes(service.id)
                        ? draft.serviceIds.filter((id) => id !== service.id)
                        : [...draft.serviceIds, service.id],
                    });
                    setSavedAt(null);
                  }}
                />
                {service.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {error && <p className="text-sm text-status-danger">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        {savedAt && <span className="mr-auto text-xs text-status-success">Saved</span>}
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </form>
  );
}

export function DepartmentConfigDialog({
  open,
  departmentId,
  hospitalId,
  onClose,
  onSaved,
}: DepartmentConfigDialogProps) {
  const { data: configs, isLoading } = useAsync(
    () => (open && departmentId ? hospitalOpsServerApi.listDepartmentConfigs(hospitalId) : Promise.resolve([])),
    [open, departmentId, hospitalId]
  );
  const { data: services } = useAsync(
    () => (open ? hospitalOpsServerApi.listServices(hospitalId) : Promise.resolve([])),
    [open, hospitalId]
  );

  const existing = configs?.find((c) => c.id === departmentId);
  const fallback: OpsDepartmentConfig = {
    id: departmentId || "unknown",
    hospitalId,
    name: "",
    code: "",
    status: "active",
    opdAvailabilityDays: ["mon", "tue", "wed", "thu", "fri"],
    serviceIds: [],
    dailyCapacity: null,
    avgConsultationMinutes: null,
    appointmentAllocationPct: null,
    walkInAllocationPct: null,
  };

  return (
    <Dialog open={open} onClose={onClose} title="Configure Department">
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ConfigForm
          key={`${departmentId}:${existing?.code ?? "new"}`}
          initial={existing ? structuredClone(existing) : fallback}
          services={(services ?? []).map((s) => ({ id: s.id, name: s.name }))}
          onSaved={onSaved}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}
