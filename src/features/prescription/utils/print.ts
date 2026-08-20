import type { Prescription } from "@/services/prescription/types";

export function printPrescription(
  prescription: Prescription,
  patientName: string,
  patientId: string
): void {
  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) return;
  const issued = prescription.issuedAt;
  const dateLabel = issued.slice(0, 10);

  const rows = prescription.medicines
    .map(
      (m) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">${m.genericName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${m.brandLabel ?? "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${m.dosage}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${m.frequency}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${m.durationDays} days</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${m.route ?? "Oral"}</td>
      </tr>`
    )
    .join("");

  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Prescription ${prescription.id}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; color: #111827; }
      .head { border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 20px; }
      .title { font-size: 20px; font-weight: 800; }
      .meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
      th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; border-bottom: 1px solid #d1d5db; padding: 8px 12px; }
      .foot { margin-top: 28px; font-size: 11px; color: #9ca3af; }
      @media print { body { padding: 16px; } }
    </style></head><body>
      <div class="head">
        <div class="title">Prescription</div>
        <div class="meta">${prescription.hospitalName} &middot; ${prescription.departmentName}</div>
        <div class="meta">Prescribing doctor: ${prescription.doctorName}</div>
        <div class="meta">Patient: ${patientName} (#${patientId}) &middot; ${dateLabel}</div>
      </div>
      <table>
        <thead><tr><th>Medicine</th><th>Brand</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Route</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${prescription.instructions ? `<p style="margin-top:16px;font-size:13px"><strong>Instructions:</strong> ${prescription.instructions}</p>` : ""}
      <div class="foot">Smart Health OPD &middot; Government of Kerala</div>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}