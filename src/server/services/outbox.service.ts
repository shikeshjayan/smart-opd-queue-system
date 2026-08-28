"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { OutboxEventModel, plain, plainList } from "@/lib/models";
import type { OutboxEvent, OutboxEventStatus } from "@/types";

export async function createOutboxEvent(
  aggregateType: string,
  aggregateId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<OutboxEvent> {
  await dbConnect();
  
  const doc = await OutboxEventModel.create({
    _id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    aggregateType,
    aggregateId,
    eventType,
    payload,
    occurredAt: new Date(),
    retryCount: 0,
    status: "pending",
  });
  
  return plain<OutboxEvent>(doc);
}

export async function getPendingEvents(limit = 100): Promise<OutboxEvent[]> {
  await dbConnect();
  
  const docs = await OutboxEventModel.find({ status: "pending" })
    .sort({ occurredAt: 1 })
    .limit(limit)
    .lean();
    
  return plainList<OutboxEvent>(docs);
}

export async function getFailedEvents(limit = 50): Promise<OutboxEvent[]> {
  await dbConnect();
  
  const docs = await OutboxEventModel.find({ status: "failed" })
    .sort({ occurredAt: 1 })
    .limit(limit)
    .lean();
    
  return plainList<OutboxEvent>(docs);
}

export async function markEventProcessing(eventId: string): Promise<void> {
  await dbConnect();
  await OutboxEventModel.updateOne(
    { _id: eventId },
    { $set: { status: "processing" } }
  );
}

export async function markEventCompleted(eventId: string): Promise<void> {
  await dbConnect();
  await OutboxEventModel.updateOne(
    { _id: eventId },
    { $set: { status: "completed", processedAt: new Date() } }
  );
}

export async function markEventFailed(eventId: string, retryCount: number): Promise<void> {
  await dbConnect();
  const status: OutboxEventStatus = retryCount >= 3 ? "failed" : "pending";
  await OutboxEventModel.updateOne(
    { _id: eventId },
    { $set: { status, retryCount } }
  );
}

export async function retryFailedEvents(): Promise<number> {
  await dbConnect();
  const result = await OutboxEventModel.updateMany(
    { status: "failed", retryCount: { $lt: 3 } },
    { $set: { status: "pending" } }
  );
  return result.modifiedCount;
}