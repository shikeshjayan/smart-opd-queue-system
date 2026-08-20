"use client";

import { useState } from "react";
import type { Appointment } from "@/services/appointments/types";
import { useAppointmentActions, useAppointmentSlots } from "../hooks/useAppointments";
import { SlotPicker } from "./SlotPicker";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

type RescheduleDialogProps = {
  open: boolean;
  appointment: Appointment;
  onClose: () => void;
  onRescheduled: () => void;
};

const TODAY = new Date().toISOString().slice(0, 10);

export function RescheduleDialog({ open, appointment, onClose, onRescheduled }: RescheduleDialogProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const slots = useAppointmentSlots(date, appointment.departmentId, appointment.doctorId);
  const actions = useAppointmentActions();

  const handleReschedule = async () => {
    const result = await actions.reschedule(appointment.id, date, time || undefined);
    if (result) onRescheduled();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Reschedule appointment">
      <p className="text-sm text-ink-700">
        The existing appointment is kept as <span className="font-medium">rescheduled</span> in history.
      </p>
      <label className="mt-4 block">
        <span className={labelCls}>New date</span>
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
      </label>
      {date && (
        <div className="mt-3">
          <span className={labelCls}>Available slots</span>
          {slots.isLoading ? (
            <p className="text-sm text-ink-500">Loading slots…</p>
          ) : slots.data && slots.data.length > 0 ? (
            <SlotPicker slots={slots.data} selectedTime={time} onSelect={setTime} />
          ) : (
            <p className="text-sm text-status-warning">No slots available on this date.</p>
          )}
        </div>
      )}
      {actions.error && (
        <p role="alert" className="mt-3 rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {actions.error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!date || (slots.data?.length ? !time : false) || actions.running !== null} onClick={() => void handleReschedule()}>
          {actions.running ? "Rescheduling..." : "Confirm Reschedule"}
        </Button>
      </div>
    </Dialog>
  );
}