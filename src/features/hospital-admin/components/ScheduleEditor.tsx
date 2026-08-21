"use client";

import { useMemo, useState } from "react";
import { WEEKDAYS } from "@/services/hospital-ops";
import type { OpdWeeklySchedule, OpsDaySchedule, ScheduleBreak } from "@/services/hospital-ops/types";
import { useOpsMutations, useWeeklySchedule } from "../hooks/useHospitalOps";
import { usePermissions } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

type DoctorOption = { id: string; name: string; departmentId: string };

function emptySchedule(hospitalId: string, departmentId: string): OpdWeeklySchedule {
  return {
    id: `sch_${departmentId}`,
    hospitalId,
    departmentId,
    days: {
      mon: null,
      tue: null,
      wed: null,
      thu: null,
      fri: null,
      sat: null,
      sun: null,
    },
    slotDurationMinutes: 10,
    maxAppointmentsPerDay: 50,
    doctorIds: [],
  };
}

function DayCard({
  label,
  day,
  editable,
  onChange,
}: {
  label: string;
  day: OpsDaySchedule | null;
  editable: boolean;
  onChange: (next: OpsDaySchedule | null) => void;
}) {
  const closed = day === null;
  const updateBreaks = (breaks: ScheduleBreak[]) => {
    if (!day) return;
    onChange({ ...day, breaks });
  };

  return (
    <div className="rounded-card border border-ink-200 bg-surface p-3 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-900">{label}</span>
        <label className="flex items-center gap-1.5 text-xs text-ink-500">
          <input
            type="checkbox"
            disabled={!editable}
            checked={!closed}
            onChange={(e) =>
              onChange(e.target.checked ? { open: "09:00", close: "13:00", breaks: [] } : null)
            }
          />
          Open
        </label>
      </div>
      {!closed && day && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              aria-label={`${label} opens at`}
              className={inputCls}
              type="time"
              disabled={!editable}
              value={day.open}
              onChange={(e) => onChange({ ...day, open: e.target.value })}
            />
            <span className="text-xs text-ink-400">to</span>
            <input
              aria-label={`${label} closes at`}
              className={inputCls}
              type="time"
              disabled={!editable}
              value={day.close}
              onChange={(e) => onChange({ ...day, close: e.target.value })}
            />
          </div>
          {day.breaks.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-token bg-surface-muted p-1.5 text-xs">
              <span className="text-ink-500">Break</span>
              <input
                aria-label={`${label} break ${i + 1} start`}
                className="h-8 rounded-btn border border-ink-300 px-1.5 text-xs"
                type="time"
                disabled={!editable}
                value={b.start}
                onChange={(e) => {
                  const breaks = [...day.breaks];
                  breaks[i] = { ...b, start: e.target.value };
                  updateBreaks(breaks);
                }}
              />
              <span className="text-ink-400">–</span>
              <input
                aria-label={`${label} break ${i + 1} end`}
                className="h-8 rounded-btn border border-ink-300 px-1.5 text-xs"
                type="time"
                disabled={!editable}
                value={b.end}
                onChange={(e) => {
                  const breaks = [...day.breaks];
                  breaks[i] = { ...b, end: e.target.value };
                  updateBreaks(breaks);
                }}
              />
              {editable && (
                <button
                  type="button"
                  aria-label={`Remove ${label} break ${i + 1}`}
                  className="ml-auto px-1.5 text-status-danger hover:underline"
                  onClick={() => updateBreaks(day.breaks.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {editable && (
            <button
              type="button"
              className="self-start text-xs font-medium text-brand-600 hover:underline"
              onClick={() => updateBreaks([...day.breaks, { start: "11:00", end: "11:15" }])}
            >
              + Add break
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ScheduleForm({
  departmentId,
  departmentName,
  doctors,
  initial,
}: {
  departmentId: string;
  departmentName: string;
  doctors: DoctorOption[];
  initial: OpdWeeklySchedule;
}) {
  const [form, setForm] = useState<OpdWeeklySchedule>(initial);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const { saveWeeklySchedule, busy, error } = useOpsMutations();
  const { can } = usePermissions();
  const editable = can("MANAGE_OPD");

  const deptDoctors = useMemo(() => doctors.filter((d) => d.departmentId === departmentId), [doctors, departmentId]);

  const save = async () => {
    const result = await saveWeeklySchedule(form);
    if (result) {
      setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-ink-500">Editing weekly OPD schedule for {departmentName}.</p>

      <div className="flex flex-wrap items-end gap-3">
        <label>
          <span className={labelCls}>Slot duration (min)</span>
          <input
            className={`${inputCls} w-32`}
            type="number"
            min={5}
            step={5}
            disabled={!editable}
            value={form.slotDurationMinutes}
            onChange={(e) =>
              setForm({ ...form, slotDurationMinutes: Math.max(5, Number(e.target.value) || 5) })
            }
          />
        </label>
        <label>
          <span className={labelCls}>Max appointments / day</span>
          <input
            className={`${inputCls} w-32`}
            type="number"
            min={1}
            disabled={!editable}
            value={form.maxAppointmentsPerDay}
            onChange={(e) =>
              setForm({ ...form, maxAppointmentsPerDay: Math.max(1, Number(e.target.value) || 1) })
            }
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {WEEKDAYS.map(({ value, label }) => (
          <DayCard
            key={value}
            label={label}
            day={form.days[value]}
            editable={editable}
            onChange={(next) => setForm({ ...form, days: { ...form.days, [value]: next } })}
          />
        ))}
      </div>

      <fieldset>
        <legend className={labelCls}>Assigned doctors</legend>
        {deptDoctors.length === 0 ? (
          <p className="text-sm text-ink-500">No doctors in this department.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {deptDoctors.map((doctor) => {
              const checked = form.doctorIds.includes(doctor.id);
              return (
                <label key={doctor.id} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    disabled={!editable}
                    checked={checked}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        doctorIds: e.target.checked
                          ? [...form.doctorIds, doctor.id]
                          : form.doctorIds.filter((id) => id !== doctor.id),
                      })
                    }
                  />
                  {doctor.name}
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      {!editable && (
        <p className="text-sm text-status-warning">You don&apos;t have permission to edit schedules.</p>
      )}
      {error && <p className="text-sm text-status-danger" role="alert">{error}</p>}
      <div className="flex items-center gap-3 border-t border-ink-200 pt-4">
        <Button size="lg" type="submit" disabled={!editable || busy}>
          {busy ? "Saving..." : "Save Schedule"}
        </Button>
        {savedAt && <p className="text-sm text-status-success">Saved at {savedAt}</p>}
      </div>
    </form>
  );
}

export function ScheduleEditor({
  hospitalId,
  departments,
  doctors,
}: {
  hospitalId: string;
  departments: Array<{ id: string; name: string }>;
  doctors: DoctorOption[];
}) {
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const { data, isLoading } = useWeeklySchedule(departmentId);

  if (!departmentId) return <EmptyState title="No departments" description="Add a department first." />;

  return (
    <div className="flex flex-col gap-4">
      <label className="block max-w-sm">
        <span className={labelCls}>Department</span>
        <select className={inputCls} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <ScheduleForm
          key={departmentId}
          departmentId={departmentId}
          departmentName={departments.find((d) => d.id === departmentId)?.name ?? departmentId}
          doctors={doctors}
          initial={
            data ? structuredClone(data) : emptySchedule(hospitalId, departmentId)
          }
        />
      )}
    </div>
  );
}
