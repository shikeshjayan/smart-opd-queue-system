"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { SlotModel, ScheduleConfigModel } from "@/lib/models";
import { plainList, plain } from "@/lib/models";

export async function generateSlotsForDate(opdId: string, date: string, hospitalId: string, departmentId: string) {
  await dbConnect();
  
  const config = await ScheduleConfigModel.findOne({ departmentId }).lean();
  if (!config) throw new Error("Schedule config not found");

  const workday = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase().slice(0, 3);
  const schedule = config.workdays[workday as keyof typeof config.workdays];
  if (!schedule || schedule === "closed") return;

  const { open, close } = schedule;
  const start = parseInt(open.split(":")[0]) * 60 + parseInt(open.split(":")[1]);
  const end = parseInt(close.split(":")[0]) * 60 + parseInt(close.split(":")[1]);
  
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
  const docs = await SlotModel.find({ opdId, date, capacity: { $gt: "$bookedCount" } }).lean();
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
