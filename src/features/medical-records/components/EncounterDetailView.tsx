import { Badge } from "@/components/ui/badge";
import { conditionStatusLabel, formatLongDate, visitTypeLabel } from "../utils/format";
import type { EncounterDetail } from "../types/medical-record.types";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">{children}</h3>
  );
}

export function EncounterDetailView({ detail }: { detail: EncounterDetail }) {
  const { encounter, chiefComplaint, summary, plan, diagnosis, prescriptions, labs, followUp } =
    detail;

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="encounter-meta-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="encounter-meta-title" className="sr-only">
          Encounter information
        </h2>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xl font-bold text-ink-900">{formatLongDate(encounter.date)}</p>
            <p className="mt-1 text-sm text-ink-500">{encounter.hospitalName}</p>
            <p className="text-sm text-ink-500">{encounter.departmentName}</p>
            <p className="mt-2 text-sm text-ink-700">{encounter.doctorName}</p>
          </div>
          <Badge variant="info">{visitTypeLabel(encounter.visitType)}</Badge>
        </div>
      </section>

      <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <SectionHeading>Reason for Visit</SectionHeading>
        <p className="text-sm text-ink-900">{chiefComplaint || "—"}</p>
      </section>

      {summary && (
        <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
          <SectionHeading>Clinical Summary</SectionHeading>
          <p className="text-sm text-ink-900">{summary}</p>
        </section>
      )}

      <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <SectionHeading>Diagnosis</SectionHeading>
        {diagnosis ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink-900">{diagnosis.name}</p>
            <Badge variant="warning">{conditionStatusLabel(diagnosis.status)}</Badge>
          </div>
        ) : (
          <p className="text-sm text-ink-500">Not recorded</p>
        )}
      </section>

      <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <SectionHeading>Treatment Plan</SectionHeading>
        <p className="text-sm text-ink-900">{plan || "—"}</p>
      </section>

      <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <SectionHeading>Prescriptions</SectionHeading>
        {prescriptions.length === 0 ? (
          <p className="text-sm text-ink-500">No medicines were prescribed.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {prescriptions.map((prescription) => (
              <li key={prescription.id} className="rounded-card border border-ink-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink-900">
                    {formatLongDate(prescription.issuedAt)} &middot; {prescription.departmentName}
                  </p>
                  <Badge variant={prescription.status === "active" ? "success" : "default"}>
                    {prescription.status === "active" ? "Active" : "Completed"}
                  </Badge>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                        <th scope="col" className="py-2 pr-4 font-medium">Medicine</th>
                        <th scope="col" className="py-2 pr-4 font-medium">Dosage</th>
                        <th scope="col" className="py-2 pr-4 font-medium">Frequency</th>
                        <th scope="col" className="py-2 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescription.medicines.map((medicine) => (
                        <tr key={medicine.name} className="border-b border-ink-100 last:border-b-0">
                          <td className="py-2 pr-4 font-medium text-ink-900">{medicine.name}</td>
                          <td className="py-2 pr-4 tabular-nums text-ink-700">{medicine.dosage}</td>
                          <td className="py-2 pr-4 tabular-nums text-ink-700">{medicine.frequency}</td>
                          <td className="py-2 text-ink-700">{medicine.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {prescription.instructions && (
                  <p className="mt-3 text-sm text-ink-600">
                    <span className="font-medium text-ink-900">Instructions: </span>
                    {prescription.instructions}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <SectionHeading>Lab Tests</SectionHeading>
        {labs.length === 0 ? (
          <p className="text-sm text-ink-500">No laboratory tests were ordered.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {labs.map((lab) => (
              <li key={lab.id} className="rounded-card border border-ink-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{lab.name}</p>
                    <p className="text-xs text-ink-500">
                      Collected {formatLongDate(lab.collectedAt)} &middot; Reported {formatLongDate(lab.reportedAt)} &middot; {lab.labName}
                    </p>
                  </div>
                  <Badge variant={lab.status === "completed" ? "success" : "warning"}>
                    {lab.status === "completed" ? "Completed" : "Pending"}
                  </Badge>
                </div>
                {lab.status === "completed" && lab.results && lab.results.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                          <th scope="col" className="py-2 pr-4 font-medium">Result</th>
                          <th scope="col" className="py-2 pr-4 font-medium">Value</th>
                          <th scope="col" className="py-2 font-medium">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lab.results.map((result) => (
                          <tr key={result.name} className="border-b border-ink-100 last:border-b-0">
                            <td className="py-2 pr-4 font-medium text-ink-900">{result.name}</td>
                            <td className="py-2 pr-4 tabular-nums text-ink-700">
                              {result.value} {result.unit ? <span className="text-ink-500">{result.unit}</span> : null}
                            </td>
                            <td className="py-2 text-ink-500">{result.range ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <SectionHeading>Follow-up</SectionHeading>
        <p className="text-sm text-ink-900">{followUp ?? "No follow-up recorded."}</p>
      </section>
    </div>
  );
}