"use client";

import { useState } from "react";
import type { Appointment } from "@/services/appointments/types";
import { useAppointmentActions } from "../hooks/useAppointments";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

type CancelAppointmentDialogProps = {
  open: boolean;
  appointment: Appointment;
  onClose: () => void;
  onCancelled: () => void;
};

export function CancelAppointmentDialog({
  open,
  appointment,
  onClose,
  onCancelled,
}: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState("");
  const actions = useAppointmentActions();

  const handleCancel = async () => {
    const result = await actions.cancel(appointment.id, reason.trim() || undefined);
    if (result) onCancelled();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Cancel appointment?">
      <p className="text-sm text-ink-700">
        The cancelled appointment remains in your history. It is not deleted.
      </p>
      <label className="mt-4 block">
        <span className={labelCls}>Reason (optional)</span>
        <input
          className={inputCls}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Change of plans"
        />
      </label>
      {actions.error && (
        <p role="alert" className="mt-3 rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {actions.error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Keep Appointment
        </Button>
        <Button variant="danger" disabled={actions.running !== null} onClick={() => void handleCancel()}>
          {actions.running ? "Cancelling..." : "Cancel Appointment"}
        </Button>
      </div>
    </Dialog>
  );
}