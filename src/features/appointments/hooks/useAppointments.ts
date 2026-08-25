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

  return {
    running,
    error,
    book: async (input: AppointmentBookingInput) => {
      return run<Appointment>("book", () => appointmentsMockApi.book(input));
    },
    confirm: (id: string) => run(`confirm:${id}`, () => appointmentsMockApi.confirm(id)),
    cancel: (id: string, reason?: string) =>
      run(`cancel:${id}`, () => appointmentsMockApi.cancel(id, reason)),
    reschedule: async (id: string, date: string, time?: string) => {
      return run(`reschedu:${id}`, () => appointmentsMockApi.reschedule(id, date, time));
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