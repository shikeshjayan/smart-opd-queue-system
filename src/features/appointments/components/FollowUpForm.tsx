import { useState } from "react";
import type { FollowUp as ConsultationFollowUp } from "@/services/consultation/types";
import { AppointmentForm } from "./AppointmentForm";

type FollowUpFormProps = {
  patientId: string;
  encounterId: string;
  departmentId: string;
  doctorId?: string;
  followUp: ConsultationFollowUp;
  onBooked: () => void;
};

const TODAY = new Date().toISOString().slice(0, 10);

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function FollowUpForm({
  patientId,
  departmentId,
  doctorId,
  followUp,
  onBooked,
}: FollowUpFormProps) {
  const [booking, setBooking] = useState(false);

  const recommendedDate =
    followUp.date && followUp.date >= TODAY ? followUp.date : addDays(TODAY, 14);

  return (
    <div className="rounded-card border border-status-info-soft bg-status-info-soft p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-status-info">
        Follow-up recommended
      </p>
      <p className="mt-1 text-sm text-ink-700">
        Your doctor recommended a follow-up{followUp.date ? ` around ${followUp.date}` : ` in 2 weeks`}.
        {followUp.notes ? ` ${followUp.notes}` : ""}
      </p>
      {!booking ? (
        <button
          type="button"
          onClick={() => setBooking(true)}
          className="mt-3 rounded-btn bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Book Follow-up
        </button>
      ) : (
        <div className="mt-3 rounded-card border border-ink-200 bg-surface p-4">
          <p className="mb-3 text-sm font-medium text-ink-900">Book your follow-up appointment</p>
          <AppointmentForm
            patientId={patientId}
            preset={{
              departmentId,
              doctorId,
              type: "follow_up",
              scheduledDate: recommendedDate,
              reason: followUp.notes,
            }}
            onBooked={onBooked}
          />
        </div>
      )}
    </div>
  );
}