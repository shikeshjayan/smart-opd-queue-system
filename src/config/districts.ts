export const DISTRICTS = [
  { id: "thiruvananthapuram", name: "Thiruvananthapuram" },
  { id: "kollam", name: "Kollam" },
  { id: "pathanamthitta", name: "Pathanamthitta" },
  { id: "alappuzha", name: "Alappuzha" },
  { id: "kottayam", name: "Kottayam" },
  { id: "idukki", name: "Idukki" },
  { id: "ernakulam", name: "Ernakulam" },
  { id: "thrissur", name: "Thrissur" },
  { id: "palakkad", name: "Palakkad" },
  { id: "malappuram", name: "Malappuram" },
  { id: "kozhikode", name: "Kozhikode" },
  { id: "wayanad", name: "Wayanad" },
  { id: "kannur", name: "Kannur" },
  { id: "kasaragod", name: "Kasaragod" },
] as const;

export type DistrictId = (typeof DISTRICTS)[number]["id"];

export function getDistrictName(id: string): string {
  return DISTRICTS.find((d) => d.id === id)?.name ?? id;
}
