export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map((part) => Number.parseInt(part, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatWait(minutes: number): string {
  return `~${minutes} min`;
}

export function formatWaitRange(minutes: number): string {
  const low = Math.max(5, Math.round(minutes * 0.7));
  const high = Math.round(minutes * 1.15);
  return `${low}–${high} min`;
}
