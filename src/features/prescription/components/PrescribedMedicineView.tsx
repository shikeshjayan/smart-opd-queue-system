import type { Prescription } from "@/services/prescription/types";
import { formatDuration } from "@/services/prescription/types";
import { PrescriptionStatus } from "./PrescriptionStatus";

type PrescribedMedicineViewProps = {
  prescription: Prescription;
  showContext?: boolean;
};

export function PrescribedMedicineView({
  prescription,
  showContext = true,
}: PrescribedMedicineViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {showContext && (
        <dl className="grid gap-x-6 gap-y-2 rounded-card border border-ink-200 bg-surface p-4 text-sm shadow-card sm:grid-cols-2">
          <div className="flex justify-between gap-2">
            <dt className="text-ink-500">Doctor</dt>
            <dd className="font-medium text-ink-900">{prescription.doctorName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-ink-500">Hospital</dt>
            <dd className="text-right font-medium text-ink-900">
              {prescription.hospitalName} · {prescription.departmentName}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-ink-500">Status</dt>
            <dd>
              <PrescriptionStatus prescription={prescription} />
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-ink-500">Date</dt>
            <dd className="font-medium text-ink-900">
              {(prescription.finalizedAt ?? prescription.createdAt).slice(0, 10)}
            </dd>
          </div>
        </dl>
      )}

      <div className="overflow-hidden rounded-card border border-ink-200 bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                <th scope="col" className="py-3 pl-4 pr-4 font-medium">Medicine</th>
                <th scope="col" className="py-3 pr-4 font-medium">Dosage</th>
                <th scope="col" className="py-3 pr-4 font-medium">Frequency</th>
                <th scope="col" className="py-3 pr-4 font-medium">Route</th>
                <th scope="col" className="py-3 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {prescription.medicines.map((medicine) => (
                <tr key={medicine.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="py-3 pl-4 pr-4">
                    <p className="font-medium text-ink-900">{medicine.medicineName}</p>
                    <p className="text-xs text-ink-500">
                      {medicine.brandLabel ? `${medicine.brandLabel} · ` : ""}
                      {medicine.genericName}
                    </p>
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-ink-700">{medicine.dosage}</td>
                  <td className="py-3 pr-4 tabular-nums text-ink-700">{medicine.frequency}</td>
                  <td className="py-3 pr-4 text-ink-700">{medicine.route}</td>
                  <td className="py-3 text-ink-700">{formatDuration(medicine.duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {prescription.medicines.some((m) => m.instructions?.trim()) && (
          <div className="border-t border-ink-100 px-4 py-3">
            {prescription.medicines
              .filter((m) => m.instructions?.trim())
              .map((m) => (
                <p key={m.id} className="text-xs text-ink-700">
                  <span className="font-medium text-ink-900">{m.medicineName}:</span>{" "}
                  {m.instructions}
                </p>
              ))}
          </div>
        )}
      </div>

      {prescription.instructions?.trim() && (
        <p className="rounded-card border border-ink-200 bg-surface px-4 py-3 text-sm text-ink-700 shadow-card">
          <span className="font-medium text-ink-900">Instructions:</span>{" "}
          {prescription.instructions}
        </p>
      )}
    </div>
  );
}