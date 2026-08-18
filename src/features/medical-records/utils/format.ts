export function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatLongDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function visitTypeLabel(visitType: string): string {
  const labels: Record<string, string> = {
    consultation: "Consultation",
    "follow-up": "Follow-up",
    review: "Review",
  };
  return labels[visitType] ?? visitType;
}

export function documentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    lab_report: "Lab Report",
    prescription: "Prescription",
    discharge_summary: "Discharge Summary",
    referral: "Referral Document",
    medical_certificate: "Medical Certificate",
    other: "Clinical Document",
  };
  return labels[type] ?? type;
}

export function conditionStatusLabel(status: string): string {
  const first = status.charAt(0).toUpperCase() + status.slice(1);
  return first;
}