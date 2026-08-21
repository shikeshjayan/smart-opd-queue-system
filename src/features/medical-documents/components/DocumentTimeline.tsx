import { Badge } from "@/components/ui/badge";
import type { MedicalDocument } from "../types/medical-document.types";
import { formatDate } from "../utils/format";
import { documentTypeLabel } from "../utils/format";

type DocumentTimelineProps = {
  documents: MedicalDocument[];
  onOpen: (document: MedicalDocument) => void;
};

export function DocumentTimeline({ documents, onOpen }: DocumentTimelineProps) {
  const years = [...new Set(documents.map((d) => d.documentDate.slice(0, 4)))].sort(
    (a, b) => b.localeCompare(a)
  );

  return (
    <div className="flex flex-col gap-6">
      {years.map((year) => (
        <section key={year} aria-label={`${year} documents`}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{year}</h3>
          <ol className="mt-3 space-y-3 border-l border-ink-200 pl-4">
            {documents
              .filter((d) => d.documentDate.slice(0, 4) === year)
              .map((document) => (
                <li key={document.id} className="relative">
                  <span
                    className="absolute -left-[21px] top-2 h-2.5 w-2.5 rounded-full bg-brand-600"
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-start justify-between gap-2 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900">{document.title}</p>
                      <p className="mt-0.5 text-sm text-ink-500">
                        {formatDate(document.documentDate)} · {document.hospitalName ?? "External record"}
                      </p>
                      {document.version > 1 && (
                        <p className="mt-0.5 text-xs text-ink-400">v{document.version} · amended</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="info">{documentTypeLabel(document.type)}</Badge>
                      <button
                        type="button"
                        onClick={() => onOpen(document)}
                        className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </div>
  );
}