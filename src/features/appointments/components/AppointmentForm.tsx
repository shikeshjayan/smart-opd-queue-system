"use client";

import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { mockHospitals, listDepartments, listOpds, mockDoctors } from "@/services/data";
import type { Appointment, AppointmentType } from "@/services/appointments/types";
import { appointmentsMockApi } from "../api/appointments.mock";
import { useAppointmentActions, useAppointmentSlots } from "../hooks/useAppointments";
import { validateBooking } from "../utils/appointments-validation";
import { SlotPicker } from "./SlotPicker";
import { Button } from "@/components/ui/button";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

type AppointmentFormProps = {
  patientId: string;
  preset?: {
    departmentId?: string;
    doctorId?: string;
    type?: AppointmentType;
    scheduledDate?: string;
    reason?: string;
  };
  onBooked: (appointment: Appointment) => void;
};

const TODAY = new Date().toISOString().slice(0, 10);

export function AppointmentForm({ patientId, preset, onBooked }: AppointmentFormProps) {
  const [hospitalId, setHospitalId] = useState(preset?.departmentId ? "hos_001" : "hos_001");
  const [departmentId, setDepartmentId] = useState(preset?.departmentId ?? "");
  const [doctorId, setDoctorId] = useState(preset?.doctorId ?? "");
  const [date, setDate] = useState(
    preset?.scheduledDate && preset.scheduledDate >= TODAY ? preset.scheduledDate : ""
  );
  const [time, setTime] = useState("");
  const [type, setType] = useState<AppointmentType>(preset?.type ?? "new_visit");
  const [reason, setReason] = useState(preset?.reason ?? "");

  const hospitals = useAsync(async () => mockHospitals, []);
  const departments = useAsync(() => Promise.resolve(listDepartments(hospitalId)), [hospitalId]);
  const doctors = useAsync(
    () =>
      Promise.resolve(
        departmentId
          ? mockDoctors.filter((d) =>
              d.opdIds.some((id) => listOpds(departmentId).some((o) => o.id === id))
            )
          : []
      ),
    [departmentId]
  );
  const config = useAsync(
    () => appointmentsMockApi.getScheduleConfig(departmentId || "", undefined),
    [departmentId]
  );
  const slots = useAppointmentSlots(date, departmentId, doctorId || undefined);
  const actions = useAppointmentActions();

  const validation = validateBooking({ patientId, departmentId, scheduledDate: date, scheduledTime: time });

  const types: AppointmentType[] =
    config.data?.appointmentTypes ?? ["new_visit", "follow_up", "review", "procedure", "other"];

  const handleBook = async () => {
    if (!validation.valid) return;
    const booked = await actions.book({
      patientId,
      hospitalId,
      departmentId,
      doctorId: doctorId || undefined,
      type,
      scheduledDate: date,
      scheduledTime: time,
      reason: reason.trim() || undefined,
    });
    if (booked) onBooked(booked);
  };

  return (
    <div className="flex flex-col gap-4">
      {actions.error && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {actions.error}
        </p>
      )}

      <label className="block">
        <span className={labelCls}>Hospital</span>
        <select
          className={inputCls}
          value={hospitalId}
          onChange={(e) => {
            setHospitalId(e.target.value);
            setDepartmentId("");
            setDoctorId("");
          }}
        >
          {hospitals.data?.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelCls}>Department</span>
        <select
          className={inputCls}
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setDoctorId("");
            setTime("");
          }}
        >
          <option value="">Select department</option>
          {departments.data?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        {validation.errors.departmentId && (
          <span className="mt-1 block text-xs text-status-danger">{validation.errors.departmentId}</span>
        )}
      </label>

      <label className="block">
        <span className={labelCls}>Doctor</span>
        <select
          className={inputCls}
          value={doctorId}
          onChange={(e) => {
            setDoctorId(e.target.value);
            setTime("");
          }}
        >
          <option value="">Any available doctor</option>
          {doctors.data?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelCls}>Type</span>
        <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as AppointmentType)}>
          {types.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelCls}>Date</span>
        <input
          className={inputCls}
          type="date"
          min={TODAY}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setTime("");
          }}
        />
        {validation.errors.scheduledDate && (
          <span className="mt-1 block text-xs text-status-danger">{validation.errors.scheduledDate}</span>
        )}
      </label>

      {date && departmentId && (
        <div>
          <span className={labelCls}>Available slots</span>
          {slots.isLoading ? (
            <p className="text-sm text-ink-500">Loading slots…</p>
          ) : slots.error ? (
            <p className="text-sm text-status-danger">{slots.error}</p>
          ) : slots.data && slots.data.length > 0 ? (
            <>
              <SlotPicker slots={slots.data} selectedTime={time} onSelect={setTime} />
              {validation.errors.scheduledTime && (
                <span className="mt-1 block text-xs text-status-danger">{validation.errors.scheduledTime}</span>
              )}
            </>
          ) : (
            <p className="rounded-card border border-status-warning-soft bg-status-warning-soft px-4 py-3 text-sm text-status-warning">
              ⚠ No slots available
              <span className="block text-xs">
                There are currently no available appointments for the selected doctor and date. Choose
                another date.
              </span>
            </p>
          )}
        </div>
      )}

      <label className="block">
        <span className={labelCls}>Reason (optional)</span>
        <input
          className={inputCls}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Follow-up after cardiac review"
        />
      </label>

      <div className="flex flex-col gap-3 border-t border-ink-200 pt-4 sm:flex-row sm:justify-end">
        <Button
          size="lg"
          disabled={actions.running !== null || !validation.valid || date === ""}
          onClick={() => void handleBook()}
        >
          {actions.running === "book" ? "Booking..." : "Confirm Appointment"}
        </Button>
      </div>
    </div>
  );
}