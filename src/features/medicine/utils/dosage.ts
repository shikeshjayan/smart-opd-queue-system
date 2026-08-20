import { parseDoseMagnitude } from "@/services/medicine";

export function timesPerDay(frequency: string): number | null {
  if (!frequency || /as needed|prn/i.test(frequency)) return null;
  const parts = frequency.split("-").map((part) => Number.parseInt(part, 10));
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return parts[0] + parts[1] + parts[2];
  }
  return 1;
}

export function dailyDoseMg(dosage: string, frequency: string): number | undefined {
  const perDose = parseDoseMagnitude(dosage);
  const times = timesPerDay(frequency);
  if (perDose === undefined || times === null) return undefined;
  return perDose * times;
}