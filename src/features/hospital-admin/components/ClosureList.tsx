"use client";

import { useState } from "react";
import { useClosures, useStaffOpsMutations } from "../hooks/useHospitalOps";
import { useHospitalAdmin } from "../hospital-context";
import { usePermissions } from "@/features/auth/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ClosureList({ departments }: { departments: Array<{ id: string; name: string }> }) {
  const { hospitalId } = useHospitalAdmin();
  const { data: closures, isLoading, reload } = useClosures(hospitalId);
  const mutations = useStaffOpsMutations();
  const { can } = usePermissions();
  const canManage = can("MANAGE_CLOSURES");
  const [showForm, setShowForm] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">
          Holidays, maintenance and emergency closures. Affected appointments are rescheduled or
          cancelled — never deleted.
        </p>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setResult(null);
              setShowForm(true);
            }}
          >
            + Add Closure
          </Button>
        )}
      </div>

      {mutations.error && (
        <p className="text-sm text-status-danger" role="alert">
          {mutations.error}
        </p>
      )}
      {result && <p className="text-sm text-status-success">{result}</p>}

      {!closures || closures.length === 0 ? (
        <EmptyState title="No closures" description="Planned holidays and emergency closures appear here." />
      ) : (
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead>Type</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Affected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(closures as Array<Record<string, unknown>>).map((c) => {
                const id = String(c.id);
                return (
                  <TableRow key={id}>
                    <TableCell className="capitalize text-ink-900">{String(c.type)}</TableCell>
                    <TableCell className="text-ink-700">
                      {c.scope === "hospital"
                        ? "Whole hospital"
                        : (c.departmentName as string | null) ?? "Department"}
                    </TableCell>
                    <TableCell className="text-xs text-ink-700">
                      {String(c.fromDate)} → {String(c.toDate)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-ink-500" title={String(c.reason)}>
                      {String(c.reason)}
                    </TableCell>
                    <TableCell className="text-center text-xs text-ink-600">
                      {Number(c.affectedTotal)}
                      {(Number(c.affectedRescheduled) > 0 || Number(c.affectedCancelled) > 0) && (
                        <span className="block text-[10px] text-ink-400">
                          {Number(c.affectedRescheduled)} moved · {Number(c.affectedCancelled)} cancelled
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "resolved" ? "default" : c.status === "cancelled" ? "danger" : "warning"}>
                        {String(c.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage &&
                        ["planned", "active"].includes(String(c.status)) &&
                        Number(c.affectedTotal) > 0 && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={mutations.busy}
                              onClick={async () => {
                                const r = await mutations.rescheduleAffected(id);
                                if (r) setResult(`${r.rescheduled} appointments rescheduled.`);
                                reload();
                              }}
                            >
                              Reschedule all
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={mutations.busy}
                              onClick={async () => {
                                const r = await mutations.cancelAffected(id);
                                if (r) setResult(`${r.cancelled} appointments cancelled with notice.`);
                                reload();
                              }}
                            >
                              Cancel all
                            </Button>
                          </div>
                        )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Closure">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const form = new FormData(e.currentTarget);
              const scope = form.get("scope") as "hospital" | "department";
              const created = await mutations.createClosure({
                hospitalId,
                scope,
                departmentId: scope === "department" ? (form.get("departmentId") as string) : null,
                type: form.get("type") as "holiday" | "maintenance" | "emergency",
                fromDate: form.get("fromDate") as string,
                toDate: form.get("toDate") as string,
                reason: form.get("reason") as string,
              });
              if (created) {
                setShowForm(false);
                setResult(`Closure saved — ${created.affectedTotal} appointment(s) affected.`);
                reload();
              }
            })();
          }}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>Type</span>
              <select className={inputCls} name="type" defaultValue="holiday">
                <option value="holiday">Holiday</option>
                <option value="maintenance">Maintenance</option>
                <option value="emergency">Emergency</option>
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Scope</span>
              <select className={inputCls} name="scope" defaultValue="hospital">
                <option value="hospital">Whole hospital</option>
                <option value="department">Single department</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className={labelCls}>Department (if scoped)</span>
            <select className={inputCls} name="departmentId" defaultValue="">
              <option value="">— Select department —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>From</span>
              <input className={inputCls} type="date" name="fromDate" required defaultValue={todayISO()} />
            </label>
            <label className="block">
              <span className={labelCls}>To</span>
              <input className={inputCls} type="date" name="toDate" required defaultValue={todayISO()} />
            </label>
          </div>
          <label className="block">
            <span className={labelCls}>Reason</span>
            <input className={inputCls} name="reason" required placeholder="e.g. Onam holiday" />
          </label>

          {mutations.error && <p className="text-sm text-status-danger">{mutations.error}</p>}
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={mutations.busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutations.busy}>
              {mutations.busy ? "Saving..." : "Create Closure"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
