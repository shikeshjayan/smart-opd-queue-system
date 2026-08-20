import { recentConsultationDurations } from "@/services/queue";
import { AVG_CONSULTATION_MINUTES } from "../config";

export function averageConsultationMinutes(): number {
  if (recentConsultationDurations.length === 0) return AVG_CONSULTATION_MINUTES;
  const sum = recentConsultationDurations.reduce((acc, minutes) => acc + minutes, 0);
  return sum / recentConsultationDurations.length;
}

export function estimateWaitMinutes(
  patientsAhead: number,
  avgMinutes: number = averageConsultationMinutes()
): number {
  return Math.max(1, Math.round(patientsAhead * avgMinutes));
}

export function formatWait(minutes: number): string {
  return `~${minutes} min`;
}

export function formatWaitRange(minutes: number): string {
  const low = Math.max(5, Math.round(minutes * 0.7));
  const high = Math.round(minutes * 1.15);
  return `${low}–${high} min`;
}
