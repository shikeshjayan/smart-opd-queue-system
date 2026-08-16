import Link from "next/link";
import type { GovernmentQueueItem } from "@/services/government/types";
import { HealthBadge } from "@/features/hospital-admin/components/HealthBadge";
import { OpdStatusBadge } from "@/features/opd/components/OpdStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/feedback/empty-state";

type QueueOverviewProps = {
  items: GovernmentQueueItem[];
  scope: "district" | "state";
};

export function QueueOverview({ items, scope }: QueueOverviewProps) {
  if (items.length === 0) {
    return <EmptyState title="No live queues" description="There are no active queues right now." />;
  }

  return (
    <section aria-labelledby="queue-overview-title">
      <h2 id="queue-overview-title" className="mb-3 text-lg font-semibold text-ink-900">
        Queue Status
      </h2>

      <div className="hidden md:block">
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead>Hospital</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>OPD</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Now Serving</TableHead>
                <TableHead className="text-right">Waiting</TableHead>
                <TableHead>Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.opdId}>
                  <TableCell className="font-medium text-ink-900">{item.hospitalName}</TableCell>
                  <TableCell className="text-ink-700">{item.departmentName}</TableCell>
                  <TableCell className="text-ink-700">{item.opdName}</TableCell>
                  <TableCell>
                    <OpdStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right text-ink-700">
                    {item.nowServing ?? "—"}
                  </TableCell>
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
                <p className="font-medium text-ink-900">{item.hospitalName}</p>
                <p className="text-sm text-ink-500">
                  {item.departmentName} &middot; {item.opdName}
                </p>
              </div>
              <HealthBadge health={item.health} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-700">
              <OpdStatusBadge status={item.status} />
              <span>
                Serving <span className="font-semibold">{item.nowServing ?? "—"}</span>
                <span className="mx-1 text-ink-300">·</span>
                Waiting <span className="font-semibold">{item.waiting}</span>
              </span>
            </div>
            {scope === "district" && (
              <Link
                href={`/district-admin/hospitals/${item.hospitalId}`}
                className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                View Hospital
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
