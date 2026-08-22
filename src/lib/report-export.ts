export type ExportableReport = {
  type: string;
  title: string;
  period: string;
  summary: Array<{ label: string; value: string | number }>;
  table: {
    columns: string[];
    rows: Array<Array<string | number>>;
  };
};

function escapeCsv(value: string | number): string {
  const raw = String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

export function reportToCsv(report: ExportableReport): string {
  const lines: string[] = [];
  lines.push(escapeCsv(report.title));
  lines.push(escapeCsv(`Period: ${report.period}`));
  lines.push("");
  if (report.summary.length > 0) {
    for (const item of report.summary) {
      lines.push([escapeCsv(item.label), escapeCsv(item.value)].join(","));
    }
    lines.push("");
  }
  lines.push(report.table.columns.map(escapeCsv).join(","));
  for (const row of report.table.rows) {
    lines.push(row.map(escapeCsv).join(","));
  }
  return lines.join("\n");
}

export function downloadReportCsv(report: ExportableReport): void {
  const blob = new Blob([`\uFEFF${reportToCsv(report)}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report.type}_${report.period.replace(/[^\w]+/g, "_")}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function printReport(): void {
  window.print();
}
