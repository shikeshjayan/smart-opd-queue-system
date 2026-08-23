import {
  listAppointmentsByPatient,
  listAppointmentsByHospital,
  getAppointment,
  getAvailableSlots,
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
  checkInAppointment,
  markNoShow,
} from "@/server/actions/appointments";
import type { Appointment, AppointmentSlot } from "@/services/appointments/types";

export const appointmentsMockApi = {
  listForPatient: (patientId: string): Promise<Appointment[]> =>
    listAppointmentsByPatient(patientId) as Promise<Appointment[]>,
  listAll: (): Promise<Appointment[]> =>
    listAppointmentsByHospital("") as Promise<Appointment[]>,
  listBetween: (_from: string, _to: string): Promise<Appointment[]> =>
    listAppointmentsByHospital("") as Promise<Appointment[]>,
  listForDate: (date: string): Promise<Appointment[]> =>
    listAppointmentsByHospital("", date) as Promise<Appointment[]>,
  listForDoctorOnDate: (_doctorId: string, date: string): Promise<Appointment[]> =>
    listAppointmentsByHospital("", date) as Promise<Appointment[]>,
  getById: (id: string): Promise<Appointment | null> =>
    getAppointment(id) as Promise<Appointment | null>,
  getSlots: (date: string, departmentId: string, doctorId?: string): Promise<AppointmentSlot[]> =>
    getAvailableSlots(date, departmentId, doctorId) as unknown as Promise<AppointmentSlot[]>,
  book: (input: any): Promise<Appointment> =>
    bookAppointment(input) as Promise<Appointment>,
  confirm: (id: string): Promise<Appointment | null> =>
    getAppointment(id) as Promise<Appointment | null>,
  cancel: (id: string, reason?: string): Promise<Appointment> =>
    cancelAppointment(id, reason) as Promise<Appointment>,
  reschedule: (id: string, date: string, time?: string): Promise<any> =>
    rescheduleAppointment(id, date, time ?? "") as Promise<any>,
  checkIn: (id: string): Promise<any> =>
    checkInAppointment(id) as Promise<any>,
  markNoShow: (id: string): Promise<Appointment | null> =>
    markNoShow(id) as Promise<Appointment | null>,
  markCompletedForToken: (_tokenNumber: string, _encounterId?: string): Promise<any> =>
    Promise.resolve(null),
  listScheduleConfigs: (): Promise<any[]> =>
    Promise.resolve([]),
  getScheduleConfig: (_departmentId: string, _doctorId?: string): Promise<any> =>
    Promise.resolve(null),
  saveScheduleConfig: (config: any): Promise<any> =>
    Promise.resolve(config),
};
