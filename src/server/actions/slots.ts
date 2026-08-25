"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { SlotModel, ScheduleConfigModel } from "@/lib/models";
import { plainList, plain } from "@/lib/models";
import { isOperatingDay, isDoctorOnLeave } from "@/server/lib/availability";

export async function generateSlotsForDate(
  opdId: string,
  date: string,
  hospitalId: string,
  departmentId: string
) {
  await dbConnect();

  const config = await ScheduleConfigModel.findOne({ departmentId }).lean();
  if (!config) throw new Error("Schedule config not found");

  // Workday/holiday/closure gate — fixed: workdays is a numeric array
  // (0 = Sunday … 6 = Saturday), previously misread as a weekday-keyed
  // object which silently generated no slots.
  if (!(await isOperatingDay(date, hospitalId, departmentId, config))) return;

  // Approved doctor leave blocks availability for that doctor's OPD.
  if (config.doctorId && (await isDoctorOnLeave(config.doctorId as string, date))) return;

  const openTime = config.openTime ?? "09:00";
  const closeTime = config.closeTime ?? "13:00";
  const start = parseInt(openTime.split(":")[0]) * 60 + parseInt(openTime.split(":")[1]);
  const end = parseInt(closeTime.split(":")[0]) * 60 + parseInt(closeTime.split(":")[1]);

  const slots = [];
  for (let time = start; time < end; time += config.slotDurationMinutes) {
    const startTime = `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
    const endTime = `${String(Math.floor((time + config.slotDurationMinutes) / 60)).padStart(2, "0")}:${String((time + config.slotDurationMinutes) % 60).padStart(2, "0")}`;

    slots.push({
      _id: `slot_${opdId}_${date}_${startTime}`,
      opdId,
      hospitalId,
      departmentId,
      date,
      startTime,
      endTime,
      capacity: config.maxBookingsPerSlot,
      bookedCount: 0,
      status: "available"
    });
  }

  await SlotModel.insertMany(slots, { ordered: false }).catch(() => {}); // Ignore duplicate keys
}

export async function getAvailableSlots(opdId: string, date: string) {
  await dbConnect();
  const docs = await SlotModel.find({ opdId, date }).lean();
  return plainList(docs);
}

export async function reserveSlot(slotId: string) {
  await dbConnect();
  const doc = await SlotModel.findOneAndUpdate(
    { _id: slotId, $expr: { $lt: ["$bookedCount", "$capacity"] } },
    { $inc: { bookedCount: 1 } },
    { new: true }
  ).lean();

  if (!doc) throw new Error("Slot unavailable or full");
  return plain(doc);
}

export async function releaseSlot(slotId: string) {
  await dbConnect();
  const doc = await SlotModel.findOneAndUpdate(
    { _id: slotId, bookedCount: { $gt: 0 } },
    { $inc: { bookedCount: -1 } },
    { new: true }
  ).lean();

  return plain(doc);
}
