"use client";

import { useState } from "react";
import type { ScheduleException, ScheduleExceptionType } from "@/services/hospital-ops/types";
import { useAffectedAppointments, useExceptions, useOpsMutations } from "../hooks/useHospitalOps";
import { usePermissions } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

const TYPE_LABELS: Record<ScheduleExceptionType, string> = {
  cancelled: "OPD Cancelled",
  doctor_unavailable: "Doctor Unavailable",
  emergency_closure: "Emergency Closure",
  holiday: "Holiday",
  custom_hours: "Custom Hours",
};

function ExceptionFormDialog({
  open,
  onClose,
  hospitalId,
  departments,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  hospitalId: string;
  departments: Array<{ id: string; name: string }>;
  onCreated: () => void;
}) {
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<ScheduleExceptionType>("cancelled");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { createException, busy } = useOpsMutations();

  const submit = async () => {
    if (!reason.trim()) {
      setLocalError("Please provide a reason.");
      return;
    }
    const result = await createException(
      { departmentId, date, type, reason: reason.trim() },
      hospitalId
    );
    if (result) {
      setLocalError(null);
      setReason("");
      onCreated();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Schedule Exception">
      <div className="flex flex-col gap-3">
        <label className="block">
          <span className={labelCls}>Department</span>
          <select className={inputCls} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>Date</span>
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block">
            <span className={labelCls}>Type</span>
            <select
              className={inputCls}
              value={type}
              onChange={(e) => setType(e.target.value as ScheduleExceptionType)}
            >
              {(Object.keys(TYPE_LABELS) as ScheduleExceptionType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className={labelCls}>Reason</span>
          <input
            className={inputCls}
            value={reason}
            placeholder="e.g. Doctor unavailable"
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        {localError && (
          <p className="text-sm text-status-danger" role="alert">
            {localError}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? "Saving..." : "Create Exception"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AffectedAppointments({ exception }: { exception: ScheduleException }) {
  const { busy, load } = useAffectedAppointments();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof load>> | null>(null);

  return (
    <div className="mt-2 border-t border-ink-100 pt-2">
      {rows === null ? (
        <button
          type="button"
          className="text-xs font-medium text-brand-600 hover:underline"
          disabled={busy}
          onClick={async () => setRows(await load(exception))}
        >
          {busy ? "Checking…" : "Show affected appointments"}
        </button>
      ) : rows.length === 0 ? (
        <p className="text-xs text-ink-500">No upcoming appointments affected on this date.</p>
      ) : (
        <ul className="flex flex-col gap-1" aria-label="Affected appointments">
          <li className="text-xs font-semibold text-ink-700">
            Patients to notify / reschedule ({rows.length})
          </li>
          {rows.map((row) => (
            <li key={row.appointmentId} className="text-xs text-ink-500">
              {row.patientName} · {row.scheduledTime ?? "—"} · {row.type}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ExceptionList({
  hospitalId,
  departments,
}: {
  hospitalId: string;
  departments: Array<{ id: string; name: string }>;
}) {
  const { data: exceptions, isLoading, error, reload } = useExceptions(hospitalId);
  const [showForm, setShowForm] = useState(false);
  const { resolveException, busy } = useOpsMutations();
  const { can } = usePermissions();
  const editable = can("MANAGE_OPD");

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error) return <EmptyState title="Unable to load exceptions" description={error} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">Temporary Changes</h2>
        {editable && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Add Exception
          </Button>
        )}
      </div>

      {!exceptions || exceptions.length === 0 ? (
        <EmptyState
          title="No schedule exceptions"
          description="Closures, holidays and doctor unavailability will appear here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {exceptions.map((exc) => {
            const dept = departments.find((d) => d.id === exc.departmentId)?.name ?? exc.departmentId;
            return (
              <li key={exc.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink-900">
                      {dept} · {new Date(`${exc.date}T00:00:00`).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-ink-500">{exc.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={exc.status === "active" ? "danger" : "default"}>
                      {exc.status === "active" ? TYPE_LABELS[exc.type] : "Resolved"}
                    </Badge>
                    {editable && exc.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={async () => {
                          await resolveException(exc.id);
                          reload();
                        }}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
                {exc.status === "active" && <AffectedAppointments exception={exc} />}
              </li>
            );
          })}
        </ul>
      )}

      <ExceptionFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        hospitalId={hospitalId}
        departments={departments}
        onCreated={reload}
      />
    </div>
  );
}
