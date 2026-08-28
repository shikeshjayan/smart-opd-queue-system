"use server";

import "server-only";
import { stateService } from "@/server/services/governance/state.service";
import { getSession } from "@/lib/auth";
import { resolveAccessContext } from "@/server/lib/resolve-access-context";

async function getAccessContext() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return resolveAccessContext(session);
}

export async function getStateStats() {
  const ctx = await getAccessContext();
  return stateService.getStats(ctx);
}

export async function getStateAnalytics(period: "today" | "weekly" | "monthly") {
  const ctx = await getAccessContext();
  return stateService.getAnalytics(period, ctx);
}

export async function listDistrictComparison() {
  const ctx = await getAccessContext();
  return stateService.getDistrictComparison(ctx);
}

export async function listHospitalDirectory(filters: { districtId?: string; query?: string }) {
  const ctx = await getAccessContext();
  return stateService.listHospitalDirectory(filters, ctx);
}

export async function getServiceAvailability() {
  const ctx = await getAccessContext();
  return stateService.getServiceAvailability(ctx);
}

export async function getCapacityByDistrict() {
  const ctx = await getAccessContext();
  return stateService.getCapacityByDistrict(ctx);
}

export async function listAnnouncements() {
  const ctx = await getAccessContext();
  return stateService.listAnnouncements(ctx);
}

export async function publishAnnouncement(input: any) {
  const ctx = await getAccessContext();
  return stateService.publishAnnouncement(input, ctx);
}

export async function getAuditLog() {
  const ctx = await getAccessContext();
  return stateService.getAuditLog(ctx);
}

export async function getAlertsSummary() {
  const ctx = await getAccessContext();
  return stateService.getAlertsSummary(ctx);
}

export async function getUsers() {
  const ctx = await getAccessContext();
  return stateService.getUsers(ctx);
}

export async function toggleHospitalActive(hospitalId: string) {
  const ctx = await getAccessContext();
  return stateService.toggleHospitalActive(hospitalId, ctx);
}

export async function getSystemHealth() {
  const ctx = await getAccessContext();
  return stateService.getSystemHealth(ctx);
}
