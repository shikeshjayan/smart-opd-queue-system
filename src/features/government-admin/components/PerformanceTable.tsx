import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/feedback/empty-state";

export type PerformanceColumn<T> = {
  key: string;
  header: string;
  align?: "right";
  render: (row: T) => ReactNode;
};

type PerformanceTableProps<T> = {
  rows: T[];
  columns: PerformanceColumn<T>[];
  emptyTitle?: string;
  emptyDescription?: string;
};

export function PerformanceTable<T>({
  rows,
  columns,
  emptyTitle = "No data",
  emptyDescription = "There is nothing to display right now.",
}: PerformanceTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const titleColumn = columns[0];

  return (
    <>
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.align === "right" ? "text-right" : ""}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={
                        col.align === "right"
                          ? "text-right font-semibold text-ink-900"
                          : "font-medium text-ink-900"
                      }
                    >
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row, index) => (
          <li key={index} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            {titleColumn.render(row)}
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {columns.slice(1).map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-2">
                  <dt className="text-xs text-ink-500">{col.header}</dt>
                  <dd className="font-medium text-ink-900">{col.render(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
