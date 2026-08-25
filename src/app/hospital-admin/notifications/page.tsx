"use client";

import { Suspense, useState, useEffect } from "react";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { notificationApi } from "@/features/notifications/api/notifications.server";

const CATEGORY_LABELS: Record<string, string> = {
  appointment: "Appointment",
  queue: "Queue",
  clinical: "Clinical",
  followup: "Follow-up",
  announcement: "Announcement",
  system: "System",
};

const CATEGORY_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  appointment: "success",
  queue: "info",
  clinical: "warning",
  followup: "default",
  announcement: "info",
  system: "default",
};

function AdminNotificationsContent() {
  const { hospitalId } = useHospitalAdmin();
  const [tab, setTab] = useState<"all" | "health" | "failed">("all");
  const [notifications, setNotifications] = useState<{
    items: any[];
    isLoading: boolean;
    error: string | null;
  }>({ items: [], isLoading: true, error: null });
  const [health, setHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [failures, setFailures] = useState<any[]>([]);

  async function loadNotifications() {
    setNotifications((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await notificationApi.listStaff(hospitalId, 100);
      setNotifications({ items: data, isLoading: false, error: null });
    } catch (e) {
      setNotifications({ items: [], isLoading: false, error: String(e) });
    }
  }

  async function loadHealth() {
    setHealthLoading(true);
    try {
      const data = await notificationApi.health(hospitalId);
      setHealth(data);
      setFailures(data.recentFailures ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setHealthLoading(false);
    }
  }

  async function handleRetry(notificationId: string) {
    try {
      await notificationApi.retry(notificationId);
      loadNotifications();
      loadHealth();
    } catch (e) {
      alert("Retry failed: " + e);
    }
  }

  useEffect(() => {
    loadNotifications();
    loadHealth();
  }, [hospitalId]);

  const tabs = [
    { value: "all", label: "All Notifications", content: <AllTab notifications={notifications} onReload={loadNotifications} /> },
    { value: "health", label: "Health", content: <HealthTab health={health} isLoading={healthLoading} onReload={loadHealth} /> },
    { value: "failed", label: "Failed", content: <FailedTab failures={failures} onRetry={handleRetry} onReload={loadNotifications} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notification Center"
        description={tab === "health" ? "Delivery health and operational metrics." : tab === "failed" ? "Failed deliveries for manual retry." : "All notifications for this hospital."}
      />

      <Tabs tabs={tabs} defaultValue="all" />
    </div>
  );
}

function AllTab({ notifications, onReload }: { notifications: any; onReload: () => void }) {
  if (notifications.isLoading) {
    return <div className="flex flex-col gap-4"><Skeleton className="h-48 w-full" /></div>;
  }
  if (notifications.error) {
    return <ErrorState message={notifications.error} onRetry={onReload} />;
  }
  if (notifications.items.length === 0) {
    return <EmptyState title="No notifications" description="All caught up." />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {notifications.items.map((n: any) => {
        const label = CATEGORY_LABELS[n.category] ?? "System";
        const variant = CATEGORY_VARIANT[n.category] ?? "default";
        return (
          <li key={n.id} className={`flex flex-wrap items-start justify-between gap-3 rounded-card border bg-surface p-4 shadow-card ${n.read ? "border-ink-200 opacity-70" : "border-brand-200"}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant={variant}>{label}</Badge>
                {n.priority === "critical" && <Badge variant="danger">Critical</Badge>}
                {!n.read && <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />}
                <span className="text-sm font-semibold text-ink-900">{n.title}</span>
              </div>
              <p className="mt-1 text-sm text-ink-700">{n.message}</p>
              <p className="mt-1 text-xs text-ink-400">{n.createdAt}</p>
            </div>
            {!n.read && (
              <button onClick={async () => { await fetch("/api/admin/notifications/read", { method: "POST", body: JSON.stringify({ id: n.id, hospitalId: n.hospitalId }) }); onReload(); }} className="text-xs font-medium text-brand-700 hover:underline">Mark read</button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function HealthTab({ health, isLoading, onReload }: { health: any; isLoading: boolean; onReload: () => void }) {
  if (isLoading || !health) {
    return <div className="flex flex-col gap-4"><Skeleton className="h-48 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Notifications" value={health.totalNotifications} />
        <MetricCard title="Total Deliveries" value={health.totalDeliveries} />
        <MetricCard title="Failed" value={health.failedDeliveries} variant="danger" />
        <MetricCard title="Pending Jobs" value={health.pendingJobs} variant="warning" />
      </div>

      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <h3 className="font-medium mb-4">By Channel (24h)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-500 border-b border-ink-200">
              <th className="pb-2">Channel</th>
              <th className="pb-2 text-right">Total</th>
              <th className="pb-2 text-right">Sent</th>
              <th className="pb-2 text-right">Delivered</th>
              <th className="pb-2 text-right">Failed</th>
            </tr>
          </thead>
          <tbody>
            {health.channelStats?.map((c: any) => (
              <tr key={c.channel} className="border-b border-ink-100">
                <td className="py-2 capitalize">{c.channel}</td>
                <td className="py-2 text-right">{c.total}</td>
                <td className="py-2 text-right">{c.sent}</td>
                <td className="py-2 text-right text-green-600">{c.delivered}</td>
                <td className="py-2 text-right text-red-600">{c.failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {health.recentFailures?.length && (
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <h3 className="font-medium mb-4 text-red-600">Recent Failures (24h)</h3>
          <ul className="flex flex-col gap-2">
            {health.recentFailures.slice(0, 10).map((f: any, i: number) => (
              <li key={i} className="flex items-center justify-between text-sm text-red-700 bg-red-50 p-2 rounded">
                <span>{f.channel} → {f.lastError ?? "Unknown error"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, variant = "default" }: { title: string; value: number; variant?: "default" | "warning" | "danger" }) {
  const color = variant === "danger" ? "text-red-600" : variant === "warning" ? "text-amber-600" : "text-brand-600";
  return (
    <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <p className="text-sm text-ink-500">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function FailedTab({ failures, onRetry, onReload }: { failures: any[]; onRetry: (id: string) => void; onReload: () => void }) {
  if (failures.length === 0) return <EmptyState title="No failed deliveries" description="All notifications delivered successfully." />;

  return (
    <ul className="flex flex-col gap-2">
      {failures.map((f, i) => (
        <li key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-red-200 bg-red-50 p-4 shadow-card">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="danger">{f.channel}</Badge>
              <span className="text-sm font-medium text-red-700">Failed</span>
            </div>
            <p className="mt-1 text-sm text-red-600">{f.lastError ?? "Unknown error"}</p>
            <p className="mt-1 text-xs text-red-500">Notification: {f.notificationId}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onRetry(f.notificationId)}>Retry</Button>
        </li>
      ))}
    </ul>
  );
}

export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-48 w-full" /></div>}>
      <AdminNotificationsContent />
    </Suspense>
  );
}