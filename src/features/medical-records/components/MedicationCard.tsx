import { Badge } from "@/components/ui/badge";

export function MedicationCard({ name, dosage, frequency, status }: {
  name: string;
  dosage: string;
  frequency: string;
  status: "active" | "stopped";
}) {
  return (
    <li className="rounded-card border border-ink-200 bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-ink-900">{name}</p>
        <Badge variant={status === "active" ? "success" : "default"}>
          {status === "active" ? "Active" : "Stopped"}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-ink-600">
        {dosage} &middot; {frequency}
      </p>
    </li>
  );
}