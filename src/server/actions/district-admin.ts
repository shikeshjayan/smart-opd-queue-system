"use server";

import "server-only";
import { districtService } from "@/server/services/governance/district.service";
import { getSession } from "@/lib/auth";
import { resolveAccessContext } from "@/server/lib/resolve-access-context";

async function getAccessContext() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return resolveAccessContext(session);
}
import type { DistrictId } from "@/config/districts";

export async function getDistrictDashboard(districtId: DistrictId) {
  const ctx = await getAccessContext();
  return districtService.getDashboard(districtId, ctx);
}

export async function getDistrictAnalytics(districtId: DistrictId, period: "today" | "weekly" | "monthly") {
  const ctx = await getAccessContext();
  return districtService.getAnalytics(districtId, period, ctx);
}

export async function listDistrictHospitalRows(districtId: DistrictId) {
  const ctx = await getAccessContext();
  return districtService.listHospitalRows(districtId, ctx);
}

export async function getDistrictComparison(districtId: DistrictId) {
  const ctx = await getAccessContext();
  return districtService.getComparison(districtId, ctx);
}

export async function getDistrictCapacity(districtId: DistrictId) {
  const ctx = await getAccessContext();
  return districtService.getCapacity(districtId, ctx);
}

export async function getDistrictResources(districtId: DistrictId) {
  const ctx = await getAccessContext();
  return districtService.getResources(districtId, ctx);
}

export async function getHospitalDoctorAvailability(hospitalId: string) {
  const ctx = await getAccessContext();
  return districtService.getDoctorAvailability(hospitalId, ctx);
}

export async function getDistrictServiceMatrix(districtId: DistrictId) {
  const ctx = await getAccessContext();
  return districtService.getServiceMatrix(districtId, ctx);
}

export async function getDistrictReferrals(districtId: DistrictId) {
  const ctx = await getAccessContext();
  return districtService.getReferrals(districtId, ctx);
}

export async function listDistrictAnnouncements(districtId: DistrictId) {
  const ctx = await getAccessContext();
  return districtService.listAnnouncements(districtId, ctx);
}

export async function publishDistrictAnnouncement(districtId: DistrictId, input: any) {
  const ctx = await getAccessContext();
  return districtService.publishAnnouncement(districtId, input, ctx);
}

export async function listDistrictAudit(districtId: DistrictId) {
  const ctx = await getAccessContext();
  return districtService.listAudit(districtId, ctx);
}

export async function getDistrictSettings(districtId: DistrictId) {
  const ctx = await getAccessContext();
  return districtService.getSettings(districtId, ctx);
}

export async function saveDistrictSettings(districtId: DistrictId, settings: any) {
  const ctx = await getAccessContext();
  return districtService.saveSettings(districtId, settings, ctx);
}

export async function getDistrictReport(districtId: DistrictId, type: string) {
  const ctx = await getAccessContext();
  return districtService.getReport(districtId, type, ctx);
}

export async function toggleDistrictHospitalActive(hospitalId: string) {
  const ctx = await getAccessContext();
  return districtService.toggleHospitalActive(hospitalId, ctx);
}
