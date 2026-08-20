import type { ReactNode } from "react";
import type { DiagnosticOrder } from "@/services/diagnostics/types";
import { formatDate } from "@/features/medical-records/utils/format";
import { OrderStatus } from "./OrderStatus";

type DiagnosticOrderSummaryProps = {
  order: DiagnosticOrder;
  patientName?: string;
  actions?: ReactNode;
};

export function DiagnosticOrderSummary({ order, patientName, actions }: DiagnosticOrderSummaryProps) {
  const date = order.orderedAt ?? order.createdAt;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ink-200 bg-surface px-4 py-3 shadow-card">
      <div>
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-900">
          {order.id}
          <span className="text-xs font-normal text-ink-500">{formatDate(date.slice(0, 10))}</span>
        </p>
        <p className="mt-0.5 text-xs text-ink-500">
          {patientName ? `${patientName} · ` : ""}
          {order.items.map((item) => item.testName).join(", ")}
          {order.items.some((item) => item.priority === "urgent") ? " · Urgent" : ""}
        </p>
        <p className="mt-0.5 text-xs text-ink-400">
          {order.doctorName} · {order.departmentName}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <OrderStatus status={order.status} />
        {actions}
      </div>
    </div>
  );
}