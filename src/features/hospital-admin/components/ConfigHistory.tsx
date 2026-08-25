"use client";

import { useState } from "react";
import { useHospitalAdmin } from "../hospital-context";
import { hospitalOpsServerApi } from "../api/hospital-ops.server";
import { useAsync } from "@/lib/use-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { inputCls } from "@/features/consultation/utils/classes";
import type { ConfigVersion } from "@/types";

const ENTITIES = [
  { value: "department_capacity", label: "Departments & capacity" },
  { value: "adminsettings", label: "Queue & token settings" },
  { value: "scheduleconfig", label: "Schedules" },
  { value: "hospital_profile", label: "Hospital profile" },
] as const;

function describeChange(c: { field: string; before: unknown; after: unknown }): string {
  const fmt = (v: unknown) =>
    v === null || v === undefined || v === ""
      ? "—"
      : typeof v === "string" && v.startsWith("[")
        ? v.replace(/[[\]"]/g, "").replace(/,/g, ", ") || "—"
        : String(v);
  return `${c.field}: ${fmt(c.before)} → ${fmt(c.after)}`;
}

export function ConfigHistory() {
  const { hospitalId } = useHospitalAdmin();
  const [entity, setEntity] = useState<(typeof ENTITIES)[number]["value"]>("department_capacity");
  const { data: versions, isLoading } = useAsync(
    () => hospitalOpsServerApi.listConfigVersions(hospitalId, entity),
    [hospitalId, entity]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Configuration history</CardTitle>
        <select
          className={`${inputCls} w-auto`}
          value={entity}
          onChange={(e) => setEntity(e.target.value as typeof entity)}
          aria-label="Configuration area"
        >
          {ENTITIES.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !versions || versions.length === 0 ? (
          <EmptyState
            title="No changes recorded yet"
            description="Every important configuration change is versioned here with who changed it."
          />
        ) : (
          <ol className="flex flex-col gap-3">
            {(versions as ConfigVersion[]).map((v) => (
              <li key={v.id} className="rounded-btn border border-ink-200 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-ink-900">
                    {v.actorName}{" "}
                    <span className="font-normal capitalize text-ink-500">({v.actorRole.replace("_", " ")})</span>
                  </span>
                  <span className="text-xs text-ink-400">
                    {new Date(v.createdAt).toLocaleString()}
                  </span>
                </div>
                {v.note && <p className="mt-1 text-xs text-ink-400">{v.note}</p>}
                <ul className="mt-2 flex flex-col gap-0.5 font-mono text-xs text-ink-600">
                  {(v.changes ?? []).map((c, i) => (
                    <li key={i}>{describeChange(c)}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
