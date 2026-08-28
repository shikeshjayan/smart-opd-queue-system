"use server";

import "server-only";
import { getPendingEvents, markEventProcessing, markEventCompleted, markEventFailed } from "@/server/services/outbox.service";
import { analyticsService } from "@/server/services/governance/analytics.service";
import { alertsService } from "@/server/services/governance/alerts.service";
import type { AccessContext } from "@/server/lib/access-context";
import { resolveAccessContext } from "@/server/lib/resolve-access-context";
import { getSession } from "@/lib/auth";

export async function processOutboxEvents(maxEvents = 50): Promise<{ processed: number; failed: number }> {
  const events = await getPendingEvents(maxEvents);
  
  if (events.length === 0) {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const event of events) {
    await markEventProcessing(event.id);
    
    try {
      await processEvent(event);
      await markEventCompleted(event.id);
      processed++;
    } catch (error) {
      console.error(`Failed to process event ${event.id}:`, error);
      await markEventFailed(event.id, event.retryCount + 1);
      failed++;
    }
  }

  return { processed, failed };
}

async function processEvent(event: any): Promise<void> {
  const { aggregateType, eventType, payload } = event;

  switch (aggregateType) {
    case "HospitalMetrics":
      if (eventType === "VisitRecorded") {
        // The metrics are already incremented in the service
        // This worker could recalculate district/state metrics periodically
        await recalculateAggregates(payload.districtId);
      }
      break;
    case "GovernmentAlert":
      if (eventType === "AlertCreated") {
        // Alert already created, could trigger notifications here
      }
      break;
  }
}

async function recalculateAggregates(districtId: string): Promise<void> {
  try {
    // Create a minimal access context for the worker
    // In production, this would use a service account
    const session = await getSession();
    if (!session) return;
    
    const ctx = await resolveAccessContext(session);
    await analyticsService.recalculateDistrictMetrics(districtId, ctx);
    await analyticsService.recalculateStateMetrics(ctx);
  } catch {
    // Worker runs without full auth context, skip if not authorized
  }
}

export async function startOutboxWorker(intervalMs = 30000): Promise<() => void> {
  let running = true;
  
  const loop = async () => {
    while (running) {
      try {
        await processOutboxEvents();
      } catch (error) {
        console.error("Outbox worker error:", error);
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  };
  
  loop();
  
  return () => {
    running = false;
  };
}

// Manual trigger for district/state metrics recalculation
export async function triggerMetricsRecalculation(): Promise<void> {
  const session = await getSession();
  if (!session) return;
  
  const ctx = await resolveAccessContext(session);
  
  const { DISTRICTS } = await import("@/config/districts");
  
  for (const d of DISTRICTS) {
    try {
      await analyticsService.recalculateDistrictMetrics(d.id, ctx);
    } catch {
      // Skip inaccessible districts
    }
  }
  
  await analyticsService.recalculateStateMetrics(ctx);
}