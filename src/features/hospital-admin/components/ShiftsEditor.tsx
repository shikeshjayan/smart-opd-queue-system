"use client";

import { useState } from "react";
import { useHospitalAdmin } from "../hospital-context";
import { useAdminDepartments } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { useShifts, useStaffOpsMutations } from "../hooks/useHospitalOps";
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
import type { ShiftTemplate } from "@/types";

export function ShiftsEditor({ departments }: { departments: Array<{ id: string; name: string }> }) {
  const { hospitalId } = useHospitalAdmin();
  const { data: shifts, isLoading, reload } = useShifts(hospitalId);
  const mutations = useStaffOpsMutations();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ShiftTemplate | null>(null);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">
          Configurable shift windows (Morning, Evening, Night). Departments can override the
          hospital-wide defaults.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditTarget(null);
            setShowForm(true);
          }}
        >
          + Add Shift
        </Button>
      </div>

      {mutations.error && (
        <p className="text-sm text-status-danger" role="alert">
          {mutations.error}
        </p>
      )}

      {!shifts || shifts.length === 0 ? (
        <EmptyState title="No shift templates" description="Add shifts like Morning 08:00–14:00." />
      ) : (
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead>Shift</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Break</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium text-ink-900">{shift.name}</TableCell>
                  <TableCell className="font-mono text-xs text-ink-700">
                    {shift.startTime}–{shift.endTime}
                  </TableCell>
                  <TableCell className="text-ink-700">
                    {shift.departmentId
                      ? departments.find((d) => d.id === shift.departmentId)?.name ?? "—"
                      : "Hospital-wide"}
                  </TableCell>
                  <TableCell className="text-ink-500">{shift.breakMinutes ?? 0} min</TableCell>
                  <TableCell>
                    <Badge variant={shift.status === "active" ? "success" : "danger"}>{shift.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditTarget(shift);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={mutations.busy}
                        onClick={async () => {
                          await mutations.setShiftStatus(
                            shift.id,
                            shift.status === "active" ? "inactive" : "active"
                          );
                          reload();
                        }}
                      >
                        {shift.status === "active" ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editTarget ? `Edit ${editTarget.name}` : "Add Shift"}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const form = new FormData(e.currentTarget);
              const result = await mutations.saveShift({
                id: editTarget?.id,
                hospitalId,
                name: form.get("name") as string,
                startTime: form.get("startTime") as string,
                endTime: form.get("endTime") as string,
                departmentId: (form.get("departmentId") as string) || null,
                breakMinutes: Number(form.get("breakMinutes") ?? 0),
              });
              if (result) {
                setShowForm(false);
                reload();
              }
            })();
          }}
          className="flex flex-col gap-3"
        >
          <label className="block">
            <span className={labelCls}>Name</span>
            <input className={inputCls} name="name" required defaultValue={editTarget?.name ?? ""} placeholder="e.g. Evening" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>Start</span>
              <input className={inputCls} type="time" name="startTime" required defaultValue={editTarget?.startTime ?? "08:00"} />
            </label>
            <label className="block">
              <span className={labelCls}>End</span>
              <input className={inputCls} type="time" name="endTime" required defaultValue={editTarget?.endTime ?? "14:00"} />
            </label>
          </div>
          <label className="block">
            <span className={labelCls}>Scope</span>
            <select className={inputCls} name="departmentId" defaultValue={editTarget?.departmentId ?? ""}>
              <option value="">— Hospital-wide —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Break (minutes)</span>
            <input className={inputCls} type="number" min={0} name="breakMinutes" defaultValue={editTarget?.breakMinutes ?? 0} />
          </label>

          {mutations.error && <p className="text-sm text-status-danger">{mutations.error}</p>}
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={mutations.busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutations.busy}>
              {mutations.busy ? "Saving..." : "Save Shift"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
