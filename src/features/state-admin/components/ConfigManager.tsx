"use client";

import { useAsync } from "@/lib/use-async";
import { stateAdminService } from "@/services/state";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

type TagListProps = {
  items: string[];
  variant?: "default" | "info" | "success";
};

function TagList({ items, variant = "default" }: TagListProps) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item}>
          <Badge variant={variant}>{item}</Badge>
        </li>
      ))}
    </ul>
  );
}

type SectionProps = {
  title: string;
  children: ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <section className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <h3 className="font-semibold text-ink-900">{title}</h3>
      {children}
    </section>
  );
}

export function ConfigManager() {
  const { data, isLoading, error, reload } = useAsync(() => stateAdminService.getConfig(), []);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Could not load configuration"} onRetry={reload} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Section title="Hospital Types">
        <TagList items={data.hospitalTypes} variant="info" />
      </Section>
      <Section title="Standard Departments">
        <TagList items={data.standardDepartments} />
      </Section>
      <Section title="Standard Services">
        <TagList items={data.standardServices} variant="success" />
      </Section>
      <Section title="Notification Rules">
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-card border border-ink-200 p-4">
            <dt className="text-xs text-ink-500">High Wait Threshold</dt>
            <dd className="mt-1 text-2xl font-bold text-status-warning">
              {data.notificationRules.highWaitThreshold} min
            </dd>
          </div>
          <div className="rounded-card border border-ink-200 p-4">
            <dt className="text-xs text-ink-500">Critical Wait Threshold</dt>
            <dd className="mt-1 text-2xl font-bold text-status-danger">
              {data.notificationRules.criticalWaitThreshold} min
            </dd>
          </div>
        </dl>
      </Section>
    </div>
  );
}
