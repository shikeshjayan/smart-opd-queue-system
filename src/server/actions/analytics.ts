"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { QueueAuditModel, QueueEntryModel } from "@/lib/models";
import { plainList } from "@/lib/models";

export async function getQueueAnalytics(opdId: string, date?: string) {
  await dbConnect();
  
  const filter: Record<string, unknown> = { opdId };
  if (date) filter.timestamp = { $gte: new Date(date), $lt: new Date(date + "T23:59:59") };
  
  const audit = await QueueAuditModel.find(filter).lean();
  const entries = await QueueEntryModel.find({ opdId }).lean();
  
  const completed = entries.filter(e => e.status === "completed");
  const waiting = entries.filter(e => e.status === "waiting");
  const called = entries.filter(e => e.status === "called");
  const inConsultation = entries.filter(e => e.status === "in_consultation");
  const cancelled = entries.filter(e => e.status === "cancelled");
  const noShow = entries.filter(e => e.status === "no_show");
  
  const durations = audit
    .filter(a => a.toStatus === "completed" && a.durationMs)
    .map(a => a.durationMs);
  
  const avgDuration = durations.length > 0 
    ? durations.reduce((a, b) => a + b, 0) / durations.length 
    : 0;
  
  return {
    totalTokens: entries.length,
    waiting: waiting.length,
    called: called.length,
    inConsultation: inConsultation.length,
    completed: completed.length,
    cancelled: cancelled.length,
    noShow: noShow.length,
    avgDurationMinutes: Math.round(avgDuration / 60000),
    longestWait: durations.length > 0 ? Math.max(...durations) : 0
  };
}

export async function getHospitalAnalytics(hospitalId: string, date?: string) {
  await dbConnect();
  
  const filter: Record<string, unknown> = { hospitalId };
  if (date) filter.timestamp = { $gte: new Date(date), $lt: new Date(date + "T23:59:59") };
  
  const audit = await QueueAuditModel.find(filter).lean();
  const entries = await QueueEntryModel.find({ hospitalId }).lean();
  
  const completed = entries.filter(e => e.status === "completed");
  const waiting = entries.filter(e => e.status === "waiting");
  
  return {
    totalTokens: entries.length,
    waiting: waiting.length,
    completed: completed.length,
    cancelled: entries.filter(e => e.status === "cancelled").length,
    noShow: entries.filter(e => e.status === "no_show").length
  };
}
