"use client";

import { useState } from "react";
import { useHospitalAdmin } from "../hospital-context";
import { useDoctorAvailability } from "../hooks/useHospitalOps";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";
import type { DayAvailability } from "@/server/actions/hospital-ops";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function AvailabilityCell({ day }: { day: DayAvailability }) {
  const state = day.onLeave
    ? { label: "Leave", cls: "bg-status-warning/15 text-status-warning border-status-warning/30" }
    : day.closure
      ? { label: "Closed", cls: "bg-ink-100 text-ink-500 border-ink-200" }
      : day.scheduled
        ? { label: "Available", cls: "bg-status-success/15 text-status-success border-status-success/30" }
        : { label: "Off day", cls: "bg-ink-100 text-ink-400 border-ink-200" };
  return (
    <div className={`rounded-btn border px-2 py-1.5 text-center text-xs font-medium ${state.cls}`}>
      <p className="font-semibold">{WEEKDAY_LABELS[day.weekday]}</p>
      <p className="text-[10px] text-ink-400">{day.date.slice(5)}</p>
      <p>{state.label}</p>
    </div>
  );
}

export function DoctorAvailability({
  doctors,
}: {
  doctors: Array<{ id: string; name: string }>;
}) {
  const { hospitalId } = useHospitalAdmin();
  const [doctorId, setDoctorId] = useState("");
  const [fromDate, setFromDate] = useState(todayISO());
  const { data: days, isLoading } = useDoctorAvailability(doctorId, hospitalId, fromDate);

  if (doctors.length === 0) {
    return <EmptyState title="No doctors" description="Add doctors to view availability." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className={labelCls}>Doctor</span>
          <select
            className={inputCls}
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
          >
            <option value="">Select doctor…</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>From</span>
          <input
            className={inputCls}
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
      </div>

      {!doctorId ? (
        <EmptyState title="Pick a doctor" description="Availability shows working days minus leave and closures." />
      ) : isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !days || days.length === 0 ? (
        <EmptyState title="No schedule configured" description="This doctor has no weekly schedule yet." />
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {days.map((day) => (
            <AvailabilityCell key={day.date} day={day} />
          ))}
        </div>
      )}
    </div>
  );
}
