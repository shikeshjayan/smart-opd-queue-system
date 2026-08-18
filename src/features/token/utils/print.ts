export function printToken(options: {
  tokenNumber: string;
  patientName: string;
  departmentName: string;
  opdName: string;
  hospitalName: string;
  date: string;
  queuePosition?: number | null;
  waitMinutes?: number | null;
}): void {
  const win = window.open("", "_blank", "width=420,height=560");
  if (!win) return;
  const time = options.date ? options.date.slice(11, 16) : "";
  const dateLabel = options.date ? options.date.slice(0, 10) : "";
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Token ${options.tokenNumber}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; color: #111827; }
      .card { border: 2px solid #111827; border-radius: 12px; padding: 28px; max-width: 320px; margin: 0 auto; text-align: center; }
      .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #6b7280; }
      .token { font-size: 64px; font-weight: 800; letter-spacing: 2px; margin: 8px 0; }
      .name { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
      .meta { font-size: 13px; color: #374151; line-height: 1.6; }
      .meta span { display: block; }
      .foot { margin-top: 20px; font-size: 11px; color: #9ca3af; }
      @media print { body { padding: 0; } .card { border-radius: 0; } }
    </style></head><body>
      <div class="card">
        <div class="label">Outpatient Token</div>
        <div class="token">${options.tokenNumber}</div>
        <div class="name">${options.patientName}</div>
        <div class="meta">
          <span>${options.departmentName} &middot; ${options.opdName}</span>
          <span>${options.hospitalName}</span>
          <span>${dateLabel} ${time}</span>
          ${options.queuePosition != null ? `<span>Queue position: ${options.queuePosition}</span>` : ""}
          ${options.waitMinutes != null ? `<span>Estimated wait: ~${options.waitMinutes} min</span>` : ""}
        </div>
        <div class="foot">Smart Health OPD &middot; Government of Kerala</div>
      </div>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}