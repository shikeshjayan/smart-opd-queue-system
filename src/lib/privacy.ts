export function maskPatientName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const [first, ...rest] = parts;
  return `${first} ${rest.map((part) => `${part[0]}.`).join(" ")}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `••••• ${digits.slice(-4)}`;
}

export function maskIdentifier(id: string): string {
  if (id.length <= 4) return "•".repeat(id.length);
  return `${"•".repeat(Math.max(0, id.length - 4))}${id.slice(-4)}`;
}
