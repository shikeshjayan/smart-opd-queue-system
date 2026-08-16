import Link from "next/link";
import type { QueueOverviewItem } from "@/services/admin/types";
import { OpdStatusBadge } from "@/features/opd/components/OpdStatusBadge";
import { HealthBadge } from "./HealthBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type QueueOverviewProps = {
  items: QueueOverviewItem[];
};

export function QueueOverview({ items }: QueueOverviewProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="queue-overview-title">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="queue-overview-title" className="text-lg font-semibold text-ink-900">
          Queue Overview
        </h2>
        <Link
          href="/hospital-admin/queues"
          className="text-sm font-medium text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          View all
        </Link>
      </div>

      <div className="hidden md:block">
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead>OPD</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Now Serving</TableHead>
                <TableHead className="text-right">Waiting</TableHead>
                <TableHead>Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.opdId}>
                  <TableCell className="font-medium text-ink-900">
                    <Link
                      href={`/hospital-admin/opd/${item.opdId}`}
                      className="text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
                    >
                      {item.opdName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-ink-700">{item.departmentName}</TableCell>
                  <TableCell>
                    <OpdStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-ink-700">{item.nowServing ?? "—"}</TableCell>
                  <TableCell className="text-right font-semibold text-ink-900">
                    {item.waiting}
                  </TableCell>
                  <TableCell>
                    <HealthBadge health={item.health} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {items.map((item) => (
          <li key={item.opdId} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/hospital-admin/opd/${item.opdId}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {item.opdName}
                </Link>
                <p className="text-sm text-ink-500">{item.departmentName}</p>
              </div>
              <HealthBadge health={item.health} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-sm text-ink-700">
              <OpdStatusBadge status={item.status} />
              <span>
                Serving <span className="font-semibold">{item.nowServing ?? "—"}</span>
                <span className="mx-1 text-ink-300">·</span>
                Waiting <span className="font-semibold">{item.waiting}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
