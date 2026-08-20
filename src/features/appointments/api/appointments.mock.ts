import { appointmentService } from "@/services/appointments";
import type { AppointmentBookingInput, ScheduleConfig } from "@/services/appointments/types";

export const appointmentsMockApi = {
  listForPatient: (patientId: string) => appointmentService.listForPatient(patientId),
  listAll: () => appointmentService.listAll(),
  listBetween: (from: string, to: string) => appointmentService.listBetween(from, to),
  listForDate: (date: string) => appointmentService.listForDate(date),
  listForDoctorOnDate: (doctorId: string, date: string) =>
    appointmentService.listForDoctorOnDate(doctorId, date),
  getById: (id: string) => appointmentService.getById(id),
  getSlots: (date: string, departmentId: string, doctorId?: string) =>
    appointmentService.getSlots(date, departmentId, doctorId),
  book: (input: AppointmentBookingInput) => appointmentService.book(input),
  confirm: (id: string) => appointmentService.confirm(id),
  cancel: (id: string, reason?: string) => appointmentService.cancel(id, reason),
  reschedule: (id: string, date: string, time?: string) =>
    appointmentService.reschedule(id, date, time),
  checkIn: (id: string) => appointmentService.checkIn(id),
  markNoShow: (id: string) => appointmentService.markNoShow(id),
  markCompletedForToken: (tokenNumber: string, encounterId?: string) =>
    appointmentService.markCompletedForToken(tokenNumber, encounterId),
  listScheduleConfigs: () => appointmentService.listScheduleConfigs(),
  getScheduleConfig: (departmentId: string, doctorId?: string) =>
    appointmentService.getScheduleConfig(departmentId, doctorId),
  saveScheduleConfig: (config: ScheduleConfig) => appointmentService.saveScheduleConfig(config),
};