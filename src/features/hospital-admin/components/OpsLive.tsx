"use client";

import { useHospitalAdmin } from "../hospital-context";
import { hospitalOpsServerApi } from "../api/hospital-ops.server";
import { useAsync } from "@/lib/use-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import type { HospitalDashboard, OperationalAlert } from "@/server/actions/hospital-dashboard";

export function TodayOverview() {
  const { hospitalId } = useHospitalAdmin();
  const { data, isLoading } = useAsync(
    () => hospitalOpsServerApi.todayOverview(hospitalId),
    [hospitalId]
  );

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data) return null;

  const stats: Array<{ label: string; value: number | string }> = [
    { label: "OPD Patients", value: data.opdPatients },
    { label: "Appointments", value: data.appointments },
    { label: "Walk-ins", value: data.walkIns },
    { label: "Waiting", value: data.waiting },
    { label: "In Consultation", value: data.inConsultation },
    { label: "Completed", value: data.completed },
    { label: "Avg Wait", value: `${data.avgWaitMinutes} min` },
    { label: "Doctors Active", value: data.doctorsActive },
    { label: "Departments Active", value: data.departmentsActive },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
      {stats.map((s) => (
        <div key={s.label} className="rounded-card border border-ink-200 bg-surface p-3 text-center shadow-card">
          <p className="text-lg font-semibold text-ink-900">{s.value}</p>
          <p className="mt-0.5 text-xs text-ink-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

const SEVERITY_VARIANT = {
  critical: "danger",
  warning: "warning",
  info: "info",
} as const;

export function OpsAlertFeed() {
  const { hospitalId } = useHospitalAdmin();
  const { data: alerts, isLoading } = useAsync(
    () => hospitalOpsServerApi.alerts(hospitalId) as Promise<OperationalAlert[]>,
    [hospitalId]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !alerts || alerts.length === 0 ? (
          <EmptyState title="All clear" description="No operational alerts right now." />
        ) : (
          <ul className="flex flex-col gap-2">
            {(alerts as OperationalAlert[]).map((a) => (
              <li key={a.id} className="flex items-start gap-3 rounded-btn border border-ink-200 p-3">
                <Badge variant={SEVERITY_VARIANT[a.severity]}>{a.severity}</Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">⚠ {a.title}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{a.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
