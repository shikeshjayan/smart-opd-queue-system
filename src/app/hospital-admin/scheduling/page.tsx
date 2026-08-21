import { redirect } from "next/navigation";

export default function LegacySchedulingPage() {
  redirect("/hospital-admin/schedules?tab=slots");
}
