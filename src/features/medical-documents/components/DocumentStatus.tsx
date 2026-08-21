import { Badge } from "@/components/ui/badge";
import type { MedicalDocument } from "../types/medical-document.types";

export function DocumentStatus({ document }: { document: MedicalDocument }) {
  const badges: { key: string; label: string; variant: "default" | "warning" | "info" }[] = [];

  if (document.status === "archived") {
    badges.push({ key: "archived", label: "Archived", variant: "warning" });
  }
  if (document.status === "deleted") {
    badges.push({ key: "deleted", label: "Deleted", variant: "warning" });
  }
  if (document.version > 1) {
    badges.push({ key: "version", label: `v${document.version} · Amendment`, variant: "info" });
  } else if (document.amendmentOf) {
    badges.push({ key: "amended", label: "Superseded", variant: "info" });
  }
  if (document.source === "patient_provided") {
    badges.push({ key: "patient", label: "Patient-provided", variant: "default" });
  } else if (document.source === "external") {
    badges.push({ key: "external", label: "External", variant: "default" });
  }

  if (badges.length === 0) return null;

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {badges.map((b) => (
        <Badge key={b.key} variant={b.variant}>
          {b.label}
        </Badge>
      ))}
    </span>
  );
}