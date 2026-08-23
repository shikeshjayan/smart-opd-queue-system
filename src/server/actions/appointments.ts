"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { AppointmentModel, SlotModel, ScheduleConfigModel } from "@/lib/models";
import { plainList, plain } from "@/lib/models";
import { reserveSlot, releaseSlot, generateSlotsForDate } from "./slots";
import { generateToken } from "./tokens";

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

  const token = await generateToken({
    opdId: apt.departmentId,
    patientId: apt.patientId,
    patientName: apt.patientName ?? "",
    hospitalId: apt.hospitalId,
    departmentId: apt.departmentId,
    priority: apt.type === "emergency" ? "emergency" : "normal",
    source: apt.type,
    appointmentId: apt._id,
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
