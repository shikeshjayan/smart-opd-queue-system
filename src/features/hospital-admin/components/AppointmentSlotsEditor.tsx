"use client";

import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { getDepartment } from "@/services/data";
import type {
  AppointmentType,
  DailySchedule,
  ScheduleConfig,
  Workday,
} from "@/services/appointments/types";
import { appointmentsMockApi } from "@/features/appointments/api/appointments.mock";
import { usePermissions } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";

const ALL_TYPES: AppointmentType[] = ["new_visit", "follow_up", "review", "procedure", "other"];
const WEEKDAYS: Array<{ value: Workday; label: string }> = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" },
];

export function AppointmentSlotsEditor() {
  const { data, isLoading, error, reload } = useAsync(
    () => appointmentsMockApi.listScheduleConfigs(),
    []
  );
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<ScheduleConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const { can } = usePermissions();
  const editable = can("MANAGE_SCHEDULING");

  const selectSchedule = (id: string) => {
    setSelectedId(id);
    const next = data?.find((c) => c.id === id);
    setForm(next ? structuredClone(next) : null);
    setSavedAt(null);
  };

  const update = (patch: Partial<ScheduleConfig>) => {
    if (!form) return;
    setForm({ ...form, ...patch });
    setSavedAt(null);
  };

  const updateDay = (day: Workday, next: DailySchedule) => {
    if (!form) return;
    setForm({ ...form, workdays: { ...form.workdays, [day]: next } });
    setSavedAt(null);
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await appointmentsMockApi.saveScheduleConfig(form);
      setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      reload();
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error) return <EmptyState title="Unable to load schedules" description={error} />;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-500">
        Slot rules that drive patient appointment booking availability per department.
      </p>
      <label className="block max-w-sm">
        <span className={labelCls}>Appointment schedule</span>
        <select className={inputCls} value={selectedId} onChange={(e) => selectSchedule(e.target.value)}>
          <option value="">Select a schedule</option>
          {data?.map((schedule) => {
            const department = getDepartment(schedule.departmentId);
            return (
              <option key={schedule.id} value={schedule.id}>
                {department?.name ?? schedule.departmentId}
                {schedule.doctorId ? ` · ${schedule.doctorId}` : " · Any doctor"}
              </option>
            );
          })}
        </select>
      </label>

      {!selectedId ? (
        <EmptyState title="Select a schedule" description="Choose a department schedule to configure." />
      ) : (
        form && (
          <div className="flex flex-col gap-4">
            <section aria-labelledby="hours-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
              <h2 id="hours-title" className="text-lg font-semibold text-ink-900">
                Working days &amp; hours
              </h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {WEEKDAYS.map(({ value, label }) => {
                  const day = form.workdays[value];
                  const closed = day === "closed";
                  return (
                    <div key={value} className="rounded-card border border-ink-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-ink-900">
                          <input
                            type="checkbox"
                            disabled={!editable}
                            checked={!closed}
                            onChange={(e) =>
                              updateDay(value, e.target.checked ? { open: "09:00", close: "13:00" } : "closed")
                            }
                          />
                          {label}
                        </label>
                      </div>
                      {!closed && (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            aria-label={`${label} opens at`}
                            className={inputCls}
                            type="time"
                            disabled={!editable}
                            value={day.open}
                            onChange={(e) => updateDay(value, { open: e.target.value, close: day.close })}
                          />
                          <span className="text-sm text-ink-500">to</span>
                          <input
                            aria-label={`${label} closes at`}
                            className={inputCls}
                            type="time"
                            disabled={!editable}
                            value={day.close}
                            onChange={(e) => updateDay(value, { open: day.open, close: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="rules-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
              <h2 id="rules-title" className="text-lg font-semibold text-ink-900">
                Slot rules
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>Slot duration (minutes)</span>
                  <input
                    className={inputCls}
                    type="number"
                    min={10}
                    step={5}
                    disabled={!editable}
                    value={form.slotDurationMinutes}
                    onChange={(e) => update({ slotDurationMinutes: Math.max(10, Number(e.target.value) || 10) })}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Max bookings per slot</span>
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    disabled={!editable}
                    value={form.maxBookingsPerSlot}
                    onChange={(e) => update({ maxBookingsPerSlot: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Holidays (comma-separated YYYY-MM-DD)</span>
                  <input
                    className={inputCls}
                    disabled={!editable}
                    value={form.holidayDates.join(", ")}
                    onChange={(e) =>
                      update({
                        holidayDates: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="2026-08-15, 2026-10-02"
                  />
                </label>
              </div>
            </section>

            <section aria-labelledby="types-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
              <h2 id="types-title" className="text-lg font-semibold text-ink-900">
                Supported appointment types
              </h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {ALL_TYPES.map((type) => {
                  const checked = form.appointmentTypes.includes(type);
                  return (
                    <label key={type} className="flex items-center gap-2 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        disabled={!editable}
                        checked={checked}
                        onChange={(e) =>
                          update({
                            appointmentTypes: e.target.checked
                              ? [...form.appointmentTypes, type]
                              : form.appointmentTypes.filter((t) => t !== type),
                          })
                        }
                      />
                      {type.replace("_", " ")}
                    </label>
                  );
                })}
              </div>
            </section>

            {!editable && (
              <p className="text-sm text-status-warning">You don&apos;t have permission to edit slot rules.</p>
            )}
            <div className="flex items-center gap-3 border-t border-ink-200 pt-4">
              <Button size="lg" disabled={!editable || saving} onClick={() => void save()}>
                {saving ? "Saving..." : "Save Slot Rules"}
              </Button>
              {savedAt && <p className="text-sm text-status-success">Saved at {savedAt}</p>}
            </div>
          </div>
        )
      )}
    </div>
  );
}
