import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { listEncounters } from "@/services/data";
import { recordForEncounter } from "@/services/consultation";
import type {
  Appointment,
  AppointmentBookingInput,
  AppointmentWithToken,
} from "@/services/appointments/types";
import { appointmentsMockApi } from "../api/appointments.mock";
import { notificationMockApi } from "@/features/notifications/api/notification.mock";

export function useAppointments(patientId: string) {
  return useAsync(() => appointmentsMockApi.listForPatient(patientId), [patientId]);
}

export function useAppointmentSlots(date: string, departmentId: string, doctorId?: string) {
  return useAsync(
    () => (date && departmentId ? appointmentsMockApi.getSlots(date, departmentId, doctorId) : Promise.resolve([])),
    [date, departmentId, doctorId]
  );
}

export function useDoctorSchedule(doctorId: string, date: string) {
  return useAsync(() => appointmentsMockApi.listForDoctorOnDate(doctorId, date), [doctorId, date]);
}

export function useAppointmentActions() {
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(key: string, action: () => Promise<T>): Promise<T | null> {
    setRunning(key);
    setError(null);
    try {
      return await action();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Appointment action failed.");
      return null;
    } finally {
      setRunning(null);
    }
  }

  async function notify(patientId: string, title: string, message: string) {
    await notificationMockApi.add(patientId, {
      id: `n_appt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: "appointment",
      title,
      message,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    running,
    error,
    book: async (input: AppointmentBookingInput) => {
      const booked = await run<Appointment>("book", () => appointmentsMockApi.book(input));
      if (booked) {
        await notify(
          input.patientId,
          "Appointment booked",
          `Your ${booked.type.replace("_", " ")} appointment is on ${booked.scheduledDate}${
            booked.scheduledTime ? ` at ${booked.scheduledTime}` : ""
          }.`
        );
      }
      return booked;
    },
    confirm: (id: string) => run(`confirm:${id}`, () => appointmentsMockApi.confirm(id)),
    cancel: (id: string, reason?: string) =>
      run(`cancel:${id}`, () => appointmentsMockApi.cancel(id, reason)),
    reschedule: async (id: string, date: string, time?: string) => {
      const result = await run(`reschedu:${id}`, () => appointmentsMockApi.reschedule(id, date, time));
      if (result) {
        await notify(
          result.next.patientId,
          "Appointment rescheduled",
          `Rescheduled to ${result.next.scheduledDate} at ${result.next.scheduledTime}.`
        );
      }
      return result;
    },
    checkIn: (id: string) => run<AppointmentWithToken>(`checkin:${id}`, () => appointmentsMockApi.checkIn(id)),
    markNoShow: (id: string) => run(`noshow:${id}`, () => appointmentsMockApi.markNoShow(id)),
  };
}

export function useFollowUpRecommendation(patientId: string) {
  return useAsync(async () => {
    const encounters = listEncounters(patientId).sort((a, b) => b.date.localeCompare(a.date));
    for (const encounter of encounters) {
      const record = recordForEncounter(encounter.id);
      if (record.followUp.decision !== "none") {
        return { encounter, followUp: record.followUp };
      }
    }
    return null;
  }, [patientId]);
}