"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  AppointmentModel,
  SlotModel,
  ScheduleConfigModel,
  HospitalModel,
  DepartmentModel,
} from "@/lib/models";
import { plainList, plain } from "@/lib/models";
import { reserveSlot, releaseSlot, generateSlotsForDate } from "./slots";
import { isOperatingDay, isDoctorOnLeave } from "@/server/lib/availability";
import { generateToken } from "./tokens";
import { notify } from "@/server/notifications/service";

async function namesFor(hospitalId: string, departmentId?: string) {
  const [hospital, department] = await Promise.all([
    HospitalModel.findById(hospitalId).select("name").lean(),
    departmentId ? DepartmentModel.findById(departmentId).select("name").lean() : Promise.resolve(null),
  ]);
  return {
    hospital: hospital?.name ?? "the hospital",
    department: department?.name ?? "OPD",
  };
}

/** Reminder fires ~24h before the appointment slot (§6). */
function reminderDueAt(date: string, time: string): string | undefined {
  const at = new Date(`${date}T${time || "09:00"}:00`);
  if (Number.isNaN(at.getTime())) return undefined;
  const due = new Date(at.getTime() - 24 * 3600_000);
  if (due.getTime() <= Date.now()) return undefined;
  return due.toISOString();
}

export async function listAppointmentsByPatient(patientId: string) {
  await dbConnect();
  const docs = await AppointmentModel.find({ patientId }).sort({ date: 1 }).lean();
  return plainList(docs);
}

export async function listAppointmentsByHospital(hospitalId: string, date?: string) {
  await dbConnect();
  const filter: Record<string, unknown> = { hospitalId };
  if (date) filter.date = date;
  const docs = await AppointmentModel.find(filter).sort({ time: 1 }).lean();
  return plainList(docs);
}

export async function getAppointment(id: string) {
  await dbConnect();
  const doc = await AppointmentModel.findOne({ _id: id }).lean();
  return plain(doc);
}

export async function getAvailableSlots(date: string, departmentId: string, doctorId?: string, hospitalId?: string) {
  await dbConnect();
  
  const config = await ScheduleConfigModel.findOne({
    departmentId,
    ...(doctorId ? { doctorId } : { doctorId: "" })
  }).lean();
  
  if (!config) return [];

  const workday = new Date(date).getDay();
  if (!(config.workdays as number[]).includes(workday)) return [];
  if ((config.holidays as string[]).includes(date)) return [];
  const resolvedHospitalId = hospitalId ?? config.hospitalId;
  if (
    resolvedHospitalId &&
    !(await isOperatingDay(date, String(resolvedHospitalId), departmentId, config))
  ) {
    return [];
  }
  if (doctorId && (await isDoctorOnLeave(doctorId, date))) return [];

  const openMinutes = timeToMinutes(config.openTime);
  const closeMinutes = timeToMinutes(config.closeTime);
  const step = config.slotDurationMinutes;

  if (hospitalId && config.departmentId) {
    await generateSlotsForDate("", date, hospitalId, departmentId);
  }

  const slots: Array<{ time: string; endTime: string; capacity: number; available: number; slotId: string }> = [];
  
  for (let t = openMinutes; t < closeMinutes; t += step) {
    const startTime = minutesToTime(t);
    const endTime = minutesToTime(t + step);
    const slotId = `slot_${departmentId}_${date}_${startTime}`;

    const existing = await SlotModel.findOne({ _id: slotId }).lean<{ capacity: number; bookedCount: number }>();
    
    if (existing) {
      slots.push({
        time: startTime,
        endTime,
        capacity: existing.capacity,
        available: Math.max(0, existing.capacity - existing.bookedCount),
        slotId,
      });
    } else {
      slots.push({
        time: startTime,
        endTime,
        capacity: config.maxBookingsPerSlot,
        available: config.maxBookingsPerSlot,
        slotId,
      });
    }
  }

  return slots;
}

export async function bookAppointment(input: {
  patientId: string;
  patientName: string;
  hospitalId: string;
  departmentId: string;
  doctorId?: string;
  type: string;
  date: string;
  time: string;
  reason?: string;
}) {
  await dbConnect();
  const now = new Date().toISOString();
  
  const aptId = `APT-${Date.now()}${Math.floor(Math.random() * 100)}`;
  
  const appointment = await AppointmentModel.create({
    _id: aptId,
    patientId: input.patientId,
    patientName: input.patientName,
    hospitalId: input.hospitalId,
    departmentId: input.departmentId,
    doctorId: input.doctorId ?? "",
    type: input.type,
    date: input.date,
    time: input.time,
    status: "scheduled",
    reason: input.reason ?? "",
    createdAt: now,
    updatedAt: now,
  });

  const names = await namesFor(input.hospitalId, input.departmentId);
  const dueAt = reminderDueAt(input.date, input.time);
  // Fire-and-forget — booking never waits on notification delivery (§1).
  await notify({
    userId: input.patientId,
    templateKey: "APPOINTMENT_BOOKED",
    params: {
      hospital: names.hospital,
      department: names.department,
      date: input.date,
      time: input.time,
      appointmentId: aptId,
    },
    idempotencyKey: `appointment:${aptId}:booked`,
    hospitalId: input.hospitalId,
    resourceType: "appointment",
    resourceId: aptId,
  });
  if (dueAt) {
    await notify({
      userId: input.patientId,
      templateKey: "APPOINTMENT_REMINDER",
      params: {
        hospital: names.hospital,
        department: names.department,
        time: input.time,
        appointmentId: aptId,
      },
      idempotencyKey: `appointment:${aptId}:reminder`,
      dueAt,
      hospitalId: input.hospitalId,
      resourceType: "appointment",
      resourceId: aptId,
    });
  }

  return plain(appointment);
}

export async function cancelAppointment(id: string, reason?: string) {
  await dbConnect();
  const doc = await AppointmentModel.findOneAndUpdate(
    { _id: id, status: { $nin: ["cancelled", "completed", "no_show"] } },
    { $set: { status: "cancelled", reason: reason ?? "Cancelled by patient", updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();
  
  if (!doc) throw new Error("Appointment not found or cannot be cancelled");
  await notify({
    userId: doc.patientId,
    templateKey: "APPOINTMENT_CANCELLED",
    params: {
      hospital: (await namesFor(doc.hospitalId)).hospital,
      date: doc.date,
      time: doc.time,
    },
    idempotencyKey: `appointment:${id}:cancelled`,
    hospitalId: doc.hospitalId,
    resourceType: "appointment",
    resourceId: id,
  });
  return plain(doc);
}

export async function rescheduleAppointment(id: string, newDate: string, newTime: string) {
  await dbConnect();
  const existing = await AppointmentModel.findOne({ _id: id }).lean();
  if (!existing) throw new Error("Appointment not found");

  const doc = await AppointmentModel.findOneAndUpdate(
    { _id: id, status: { $nin: ["cancelled", "completed", "no_show"] } },
    {
      $set: {
        date: newDate,
        time: newTime,
        status: "scheduled",
        updatedAt: new Date().toISOString()
      },
      $push: {
        rescheduleHistory: {
          date: existing.date,
          time: existing.time,
          rescheduledAt: new Date().toISOString()
        }
      }
    },
    { new: true }
  ).lean();

  if (doc) {
    const names = await namesFor(doc.hospitalId, doc.departmentId);
    await notify({
      userId: doc.patientId,
      templateKey: "APPOINTMENT_RESCHEDULED",
      params: {
        hospital: names.hospital,
        department: names.department,
        date: newDate,
        time: newTime,
        appointmentId: id,
      },
      idempotencyKey: `appointment:${id}:rescheduled:${newDate}:${newTime}`,
      hospitalId: doc.hospitalId,
      resourceType: "appointment",
      resourceId: id,
    });
    const dueAt = reminderDueAt(newDate, newTime);
    if (dueAt) {
      await notify({
        userId: doc.patientId,
        templateKey: "APPOINTMENT_REMINDER",
        params: { hospital: names.hospital, department: names.department, time: newTime, appointmentId: id },
        idempotencyKey: `appointment:${id}:reminder:${newDate}`,
        dueAt,
        hospitalId: doc.hospitalId,
        resourceType: "appointment",
        resourceId: id,
      });
    }
  }

  return plain(doc);
}

export async function checkInAppointment(id: string) {
  await dbConnect();
  const apt = await AppointmentModel.findOneAndUpdate(
    { _id: id, status: { $in: ["scheduled", "confirmed"] } },
    { $set: { status: "checked_in", updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();

  if (!apt) throw new Error("Appointment not found or not in check-in state");

  const token = (await generateToken({
    opdId: apt.departmentId,
    patientId: apt.patientId,
    patientName: apt.patientName ?? "",
    hospitalId: apt.hospitalId,
    departmentId: apt.departmentId,
    priority: apt.type === "emergency" ? "emergency" : "normal",
    source: apt.type,
    appointmentId: apt._id,
  })) as { _id?: string; tokenNumber?: string };

  const names = await namesFor(apt.hospitalId, apt.departmentId);
  await notify({
    userId: apt.patientId,
    templateKey: "QUEUE_CHECKED_IN",
    params: {
      hospital: names.hospital,
      department: names.department,
      token: token.tokenNumber ?? "",
    },
    idempotencyKey: `queue:${token._id ?? token.tokenNumber}:checked_in`,
    hospitalId: apt.hospitalId,
    resourceType: "token",
    resourceId: String(token._id ?? token.tokenNumber ?? ""),
  });

  return { appointment: plain(apt), token };
}

export async function markNoShow(id: string) {
  await dbConnect();
  const doc = await AppointmentModel.findOneAndUpdate(
    { _id: id, status: { $in: ["scheduled", "confirmed"] } },
    { $set: { status: "no_show", updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();

  return plain(doc);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
