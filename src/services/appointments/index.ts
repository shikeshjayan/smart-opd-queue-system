import {
  getDepartment,
  getPatient,
  listOpds,
  listQueue,
} from "../data";
import { registrationService } from "../registration";
import type {
  Appointment,
  AppointmentBookingInput,
  AppointmentSlot,
  AppointmentType,
  AppointmentWithToken,
  DailySchedule,
  ScheduleConfig,
  Workday,
} from "./types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

const APPOINTMENTS_KEY = "smart-health.appointments";
const SCHEDULE_KEY = "smart-health.schedule-configs";

const ALL_TYPES: AppointmentType[] = ["new_visit", "follow_up", "review", "procedure", "other"];

function weekdayFor(date: string): Workday {
  const d = new Date(`${date}T00:00:00`);
  const map: Workday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[d.getDay()];
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function fromMinutes(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function load<T>(key: string, seed: () => T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch {
    // ignore corrupt storage
  }
  const seeded = seed();
  try {
    localStorage.setItem(key, JSON.stringify(seeded));
  } catch {
    // storage unavailable
  }
  return seeded;
}

function save<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable
  }
}

function nextId(): string {
  return `APT-${Date.now()}${Math.floor(Math.random() * 100)}`;
}

function seedAppointments(): Appointment[] {
  const base = {
    hospitalId: "hos_001",
    createdAt: "2026-08-18T09:00:00",
    updatedAt: "2026-08-18T09:00:00",
  };
  return [
    {
      ...base,
      id: "APT-1001",
      patientId: "P10294",
      departmentId: "dep_001",
      doctorId: "doc_001",
      type: "follow_up",
      scheduledDate: "2026-08-24",
      scheduledTime: "10:30",
      status: "scheduled",
      reason: "Follow-up after cardiac review",
    },
    {
      ...base,
      id: "APT-1002",
      patientId: "P10294",
      departmentId: "dep_001",
      doctorId: "doc_001",
      type: "review",
      scheduledDate: "2026-08-25",
      scheduledTime: "10:00",
      status: "confirmed",
    },
    {
      ...base,
      id: "APT-1003",
      patientId: "P10421",
      departmentId: "dep_002",
      doctorId: "doc_002",
      type: "new_visit",
      scheduledDate: "2026-08-24",
      scheduledTime: "10:00",
      status: "scheduled",
    },
    {
      ...base,
      id: "APT-1004",
      patientId: "P10294",
      departmentId: "dep_001",
      doctorId: "doc_001",
      type: "follow_up",
      scheduledDate: "2026-08-18",
      scheduledTime: "09:30",
      status: "completed",
      tokenNumber: "A-012",
      encounterId: "E20260815001",
      reason: "Cardiology follow-up",
    },
    {
      ...base,
      id: "APT-2031",
      patientId: "P10302",
      departmentId: "dep_001",
      doctorId: "doc_001",
      type: "new_visit",
      scheduledDate: "2026-08-18",
      scheduledTime: "09:35",
      status: "completed",
      tokenNumber: "A-041",
    },
    {
      ...base,
      id: "APT-2027",
      patientId: "P10421",
      departmentId: "dep_004",
      type: "new_visit",
      scheduledDate: "2026-08-17",
      scheduledTime: "11:10",
      status: "completed",
      tokenNumber: "P-018",
    },
    {
      ...base,
      id: "APT-1005",
      patientId: "P10302",
      departmentId: "dep_001",
      doctorId: "doc_001",
      type: "new_visit",
      scheduledDate: "2026-08-24",
      scheduledTime: "11:00",
      status: "scheduled",
    },
    {
      ...base,
      id: "APT-1006",
      patientId: "P10301",
      departmentId: "dep_001",
      doctorId: "doc_001",
      type: "new_visit",
      scheduledDate: "2026-08-24",
      scheduledTime: "11:00",
      status: "scheduled",
    },
  ];
}

function seedSchedules(): ScheduleConfig[] {
  const openMonSat: Record<Workday, DailySchedule> = {
    mon: { open: "09:00", close: "13:00" },
    tue: { open: "09:00", close: "13:00" },
    wed: { open: "09:00", close: "13:00" },
    thu: { open: "09:00", close: "13:00" },
    fri: { open: "09:00", close: "13:00" },
    sat: { open: "09:00", close: "13:00" },
    sun: "closed",
  };
  return [
    {
      id: "sch_001",
      departmentId: "dep_001",
      doctorId: "doc_001",
      workdays: openMonSat,
      slotDurationMinutes: 30,
      maxBookingsPerSlot: 2,
      holidayDates: [],
      appointmentTypes: ALL_TYPES,
    },
    {
      id: "sch_002",
      departmentId: "dep_002",
      doctorId: "doc_002",
      workdays: openMonSat,
      slotDurationMinutes: 30,
      maxBookingsPerSlot: 3,
      holidayDates: [],
      appointmentTypes: ALL_TYPES,
    },
    {
      id: "sch_003",
      departmentId: "dep_004",
      workdays: {
        mon: { open: "09:00", close: "12:00" },
        tue: { open: "09:00", close: "12:00" },
        wed: "closed",
        thu: { open: "09:00", close: "12:00" },
        fri: { open: "09:00", close: "12:00" },
        sat: "closed",
        sun: "closed",
      },
      slotDurationMinutes: 30,
      maxBookingsPerSlot: 2,
      holidayDates: [],
      appointmentTypes: ALL_TYPES,
    },
    {
      id: "sch_004",
      departmentId: "dep_003",
      workdays: {
        mon: { open: "09:00", close: "13:00" },
        tue: "closed",
        wed: { open: "09:00", close: "13:00" },
        thu: "closed",
        fri: { open: "09:00", close: "13:00" },
        sat: "closed",
        sun: "closed",
      },
      slotDurationMinutes: 30,
      maxBookingsPerSlot: 2,
      holidayDates: [],
      appointmentTypes: ALL_TYPES,
    },
  ];
}

let appointments: Appointment[] | null = null;
let schedules: ScheduleConfig[] | null = null;

function ensureLoaded(): void {
  if (appointments === null) appointments = load(APPOINTMENTS_KEY, seedAppointments);
  if (schedules === null) schedules = load(SCHEDULE_KEY, seedSchedules);
}

function nowIso(): string {
  return new Date().toISOString();
}

function scheduleFor(departmentId: string, doctorId?: string): ScheduleConfig | undefined {
  return (
    schedules?.find((s) => s.doctorId === doctorId && s.departmentId === departmentId) ??
    schedules?.find((s) => !s.doctorId && s.departmentId === departmentId)
  );
}

function bookedCount(date: string, time: string, departmentId: string, doctorId?: string): number {
  return (appointments ?? []).filter(
    (a) =>
      a.scheduledDate === date &&
      a.scheduledTime === time &&
      a.departmentId === departmentId &&
      (doctorId ? a.doctorId === doctorId : true) &&
      ["scheduled", "confirmed", "checked_in", "completed"].includes(a.status)
  ).length;
}

function buildSlots(
  date: string,
  departmentId: string,
  doctorId?: string
): AppointmentSlot[] {
  const schedule = scheduleFor(departmentId, doctorId);
  if (!schedule) return [];
  const day = schedule.workdays[weekdayFor(date)];
  if (day === "closed") return [];
  if (schedule.holidayDates.includes(date)) return [];

  const open = toMinutes(day.open);
  const close = toMinutes(day.close);
  const step = Math.max(10, schedule.slotDurationMinutes);
  const slots: AppointmentSlot[] = [];
  for (let time = open; time < close; time += step) {
    const timeLabel = fromMinutes(time);
    const booked = bookedCount(date, timeLabel, departmentId, doctorId);
    slots.push({
      date,
      time: timeLabel,
      capacity: schedule.maxBookingsPerSlot,
      available: Math.max(0, schedule.maxBookingsPerSlot - booked),
    });
  }
  return slots;
}

function effectiveStatus(appointment: Appointment): Appointment["status"] {
  if (
    (appointment.status === "scheduled" || appointment.status === "confirmed") &&
    appointment.scheduledDate < today()
  ) {
    return "no_show";
  }
  return appointment.status;
}

function sortByDate(list: Appointment[]): Appointment[] {
  return [...list].sort(
    (a, b) =>
      a.scheduledDate.localeCompare(b.scheduledDate) ||
      (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? "")
  );
}

export const appointmentService = {
  async listForPatient(patientId: string): Promise<Appointment[]> {
    await delay();
    ensureLoaded();
    return sortByDate(
      (appointments ?? [])
        .filter((a) => a.patientId === patientId)
        .map((a) => ({ ...a, status: effectiveStatus(a) }))
    );
  },

  async listAll(): Promise<Appointment[]> {
    await delay();
    ensureLoaded();
    return sortByDate(
      (appointments ?? []).map((a) => ({ ...a, status: effectiveStatus(a) }))
    );
  },

  async listBetween(from: string, to: string): Promise<Appointment[]> {
    await delay();
    ensureLoaded();
    return sortByDate(
      (appointments ?? [])
        .filter((a) => a.scheduledDate >= from && a.scheduledDate <= to)
        .map((a) => ({ ...a, status: effectiveStatus(a) }))
    );
  },

  async listForDate(date: string): Promise<Appointment[]> {
    await delay();
    ensureLoaded();
    return sortByDate(
      (appointments ?? [])
        .filter((a) => a.scheduledDate === date)
        .map((a) => ({ ...a, status: effectiveStatus(a) }))
    );
  },

  async listForDoctorOnDate(doctorId: string, date: string): Promise<Appointment[]> {
    await delay();
    ensureLoaded();
    return sortByDate(
      (appointments ?? [])
        .filter((a) => a.doctorId === doctorId && a.scheduledDate === date)
        .map((a) => ({ ...a, status: effectiveStatus(a) }))
    );
  },

  async getById(id: string): Promise<Appointment | undefined> {
    await delay();
    ensureLoaded();
    const appointment = (appointments ?? []).find((a) => a.id === id);
    return appointment ? { ...appointment, status: effectiveStatus(appointment) } : undefined;
  },

  async getSlots(date: string, departmentId: string, doctorId?: string): Promise<AppointmentSlot[]> {
    await delay();
    ensureLoaded();
    return buildSlots(date, departmentId, doctorId);
  },

  async book(input: AppointmentBookingInput): Promise<Appointment> {
    await delay();
    ensureLoaded();
    const slots = buildSlots(input.scheduledDate, input.departmentId, input.doctorId);
    const slot = slots.find((s) => s.time === input.scheduledTime);
    if (!slot) {
      throw new Error("This time is not available for the selected doctor and department.");
    }
    if (slot.available <= 0) {
      throw new Error("This slot was just booked by another patient. Please select another time.");
    }
    const now = nowIso();
    const appointment: Appointment = {
      id: nextId(),
      patientId: input.patientId,
      hospitalId: input.hospitalId,
      departmentId: input.departmentId,
      doctorId: input.doctorId,
      type: input.type,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      status: "scheduled",
      reason: input.reason,
      createdAt: now,
      updatedAt: now,
    };
    appointments = [appointment, ...(appointments ?? [])];
    save(APPOINTMENTS_KEY, appointments);
    return appointment;
  },

  async confirm(id: string): Promise<Appointment | undefined> {
    await delay();
    ensureLoaded();
    const list = appointments ?? [];
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    list[index] = {
      ...list[index],
      status: "confirmed",
      updatedAt: nowIso(),
    };
    appointments = list;
    save(APPOINTMENTS_KEY, appointments);
    return list[index];
  },

  async cancel(id: string, reason?: string): Promise<Appointment | undefined> {
    await delay();
    ensureLoaded();
    const list = appointments ?? [];
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    if (list[index].status === "cancelled") {
      throw new Error("Appointment is already cancelled.");
    }
    list[index] = {
      ...list[index],
      status: "cancelled",
      cancelledReason: reason,
      cancelledAt: nowIso(),
      updatedAt: nowIso(),
    };
    appointments = list;
    save(APPOINTMENTS_KEY, appointments);
    return list[index];
  },

  async reschedule(
    id: string,
    newDate: string,
    newTime?: string
  ): Promise<{ old: Appointment; next: Appointment } | undefined> {
    await delay();
    ensureLoaded();
    const existing = (appointments ?? []).find((a) => a.id === id);
    if (!existing) return undefined;
    if (existing.status === "cancelled" || existing.status === "completed") {
      throw new Error("This appointment can no longer be rescheduled.");
    }
    const slots = buildSlots(newDate, existing.departmentId, existing.doctorId);
    const slot = newTime ? slots.find((s) => s.time === newTime) : slots[0];
    if (!slot) {
      throw new Error("No available slot on the selected date.");
    }
    if (slot.available <= 0) {
      throw new Error("This slot was just booked by another patient. Please select another time.");
    }
    const now = nowIso();
    const nextAppointment: Appointment = {
      id: nextId(),
      patientId: existing.patientId,
      hospitalId: existing.hospitalId,
      departmentId: existing.departmentId,
      doctorId: existing.doctorId,
      type: existing.type,
      scheduledDate: newDate,
      scheduledTime: slot.time,
      status: "scheduled",
      reason: existing.reason,
      createdAt: now,
      updatedAt: now,
      rescheduledFrom: existing.id,
    };
    const list = appointments ?? [];
    const index = list.findIndex((a) => a.id === id);
    list[index] = {
      ...existing,
      status: "rescheduled",
      rescheduledTo: nextAppointment.id,
      updatedAt: now,
    };
    appointments = [nextAppointment, ...list];
    save(APPOINTMENTS_KEY, appointments);
    return { old: list[index], next: nextAppointment };
  },

  async checkIn(id: string): Promise<AppointmentWithToken> {
    await delay();
    ensureLoaded();
    const appointment = (appointments ?? []).find((a) => a.id === id);
    if (!appointment) throw new Error("Appointment not found.");
    if (appointment.status === "checked_in") throw new Error("Patient is already checked in.");
    if (appointment.status === "completed") throw new Error("Appointment is already completed.");
    if (appointment.status === "cancelled") throw new Error("Appointment is cancelled.");

    const department = getDepartment(appointment.departmentId);
    const opds = listOpds(appointment.departmentId);
    const opd = opds[0];
    if (!opd) throw new Error("No OPD is available for this department.");

    const patient = getPatient(appointment.patientId);
    const result = await registrationService.generateToken({
      patientId: appointment.patientId,
      patientName: patient?.name ?? "Patient",
      opdId: opd.id,
      registrationType: "appointment",
      appointmentId: appointment.id,
      isNewPatient: false,
    });

    const waiting = listQueue(opd.id)
      .filter((q) => q.status === "waiting")
      .sort((a, b) => a.tokenNumber.localeCompare(b.tokenNumber));
    const queuePosition = waiting.findIndex((q) => q.tokenNumber === result.token.tokenNumber) + 1;

    const list = appointments ?? [];
    const index = list.findIndex((a) => a.id === id);
    const updated: Appointment = {
      ...list[index],
      status: "checked_in",
      tokenNumber: result.token.tokenNumber,
      updatedAt: nowIso(),
    };
    list[index] = updated;
    appointments = list;
    save(APPOINTMENTS_KEY, appointments);

    return {
      appointment: updated,
      token: {
        tokenNumber: result.token.tokenNumber,
        queuePosition,
        opdName: opd.name,
        departmentName: department?.name ?? "",
      },
    };
  },

  async markNoShow(id: string): Promise<Appointment | undefined> {
    await delay();
    ensureLoaded();
    const list = appointments ?? [];
    const index = list.findIndex((a) => a.id === id);
    if (index === -1 || list[index].status !== "scheduled" && list[index].status !== "confirmed") {
      return undefined;
    }
    list[index] = { ...list[index], status: "no_show", updatedAt: nowIso() };
    appointments = list;
    save(APPOINTMENTS_KEY, appointments);
    return list[index];
  },

  async markCompletedForToken(tokenNumber: string, encounterId?: string): Promise<Appointment | undefined> {
    await delay();
    ensureLoaded();
    const list = appointments ?? [];
    const index = list.findIndex((a) => a.tokenNumber === tokenNumber);
    if (index === -1 || list[index].status !== "checked_in") return undefined;
    list[index] = {
      ...list[index],
      status: "completed",
      encounterId: encounterId ?? list[index].encounterId,
      updatedAt: nowIso(),
    };
    appointments = list;
    save(APPOINTMENTS_KEY, appointments);
    return list[index];
  },

  async listScheduleConfigs(): Promise<ScheduleConfig[]> {
    await delay();
    ensureLoaded();
    return [...(schedules ?? [])];
  },

  async getScheduleConfig(departmentId: string, doctorId?: string): Promise<ScheduleConfig | undefined> {
    await delay();
    ensureLoaded();
    return scheduleFor(departmentId, doctorId);
  },

  async saveScheduleConfig(config: ScheduleConfig): Promise<ScheduleConfig> {
    await delay();
    ensureLoaded();
    const list = schedules ?? [];
    const index = list.findIndex((s) => s.id === config.id);
    const updated = { ...config, updatedAt: nowIso() };
    if (index === -1) {
      schedules = [...list, updated];
    } else {
      schedules = list.map((s) => (s.id === config.id ? updated : s));
    }
    save(SCHEDULE_KEY, schedules);
    return updated;
  },
};