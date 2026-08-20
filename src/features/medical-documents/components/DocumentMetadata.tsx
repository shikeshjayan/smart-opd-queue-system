import type { MedicalDocument } from "../types/medical-document.types";
import {
  documentTypeLabel,
  formatBytes,
  formatDateTime,
  sourceLabel,
  statusLabel,
} from "../utils/format";

type DocumentMetadataProps = {
  document: MedicalDocument;
};

export function DocumentMetadata({ document }: DocumentMetadataProps) {
  const rows: [string, string][] = [
    ["Type", documentTypeLabel(document.type)],
    ["Date", document.documentDate],
    ["Hospital", document.hospitalName ?? "External record"],
    ...(document.departmentName ? ([["Department", document.departmentName]] as [string, string][]) : []),
    ["Uploaded", formatDateTime(document.updatedAt)],
    ["Uploaded by", `${document.uploadedBy} (${document.uploadedByRole.replace("_", " ")})`],
    ["Source", sourceLabel(document.source)],
    ["Status", statusLabel(document.status)],
    ["Version", document.version > 1 ? `v${document.version}` : "v1"],
    ["Size", formatBytes(document.size)],
    ["File type", document.mimeType],
  ];

  if (document.encounterId) rows.push(["Linked encounter", document.encounterId]);
  if (document.amendedFrom) rows.push(["Amended from", document.amendedFrom]);
  if (document.amendmentOf) rows.push(["Amendment", document.amendmentOf]);

  return (
    <dl className="divide-y divide-ink-100">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 py-2">
          <dt className="text-sm text-ink-500">{label}</dt>
          <dd className="text-right text-sm font-medium text-ink-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}