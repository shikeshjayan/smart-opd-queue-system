"use client";

import { Fragment, useState } from "react";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { hospitalOpsServerApi } from "@/features/hospital-admin/api/hospital-ops.server";
import {
  useOpsLeaves,
  useOpsStaff,
  useStaffOpsMutations,
} from "@/features/hospital-admin/hooks/useHospitalOps";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
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
import { usePermissions } from "@/features/auth/hooks/useAuth";
import type { StaffLeave } from "@/types";

type LeaveImpact = {
  total: number;
  appointments: Array<{
    id: string;
    patientName: string;
    date: string;
    time: string;
    status: string;
    departmentId: string | null;
  }>;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function StaffLeavePage() {
  const { hospitalId } = useHospitalAdmin();
  const [statusFilter, setStatusFilter] = useState<"" | StaffLeave["status"]>("pending");
  const { data: leaves, isLoading, reload } = useOpsLeaves(hospitalId, statusFilter || undefined);
  const { data: staff } = useOpsStaff(hospitalId);
  const mutations = useStaffOpsMutations();
  const { can } = usePermissions();
  const canApprove = can("APPROVE_LEAVE");
  const canRequest = can("MANAGE_STAFF") || can("REQUEST_LEAVE");
  const [showRequest, setShowRequest] = useState(false);
  const [impact, setImpact] = useState<{ leaveId: string; data: LeaveImpact } | null>(null);

  async function act(fn: () => Promise<unknown>) {
    await fn();
    reload();
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leave Management"
        description="Doctor and staff leave. Approving a leave recalculates appointment availability."
        actions={
          <div className="flex items-center gap-2">
            <select
              className={`${inputCls} w-auto`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              aria-label="Filter by status"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {canRequest && (
              <Button onClick={() => setShowRequest(true)}>Request Leave</Button>
            )}
          </div>
        }
      />

      {mutations.error && (
        <p className="text-sm text-status-danger" role="alert">
          {mutations.error}
        </p>
      )}

      {!leaves || leaves.length === 0 ? (
        <EmptyState title="No leave requests" description="Leave requests will appear here." />
      ) : (
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead>Staff</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((leave) => (
                <Fragment key={leave.id}>
                  <TableRow>
                    <TableCell className="font-medium text-ink-900">{leave.staffName}</TableCell>
                    <TableCell className="text-ink-700">{leave.fromDate}</TableCell>
                    <TableCell className="text-ink-700">{leave.toDate}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-ink-500" title={leave.reason}>
                      {leave.reason}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          leave.status === "approved"
                            ? "success"
                            : leave.status === "pending"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(leave.status === "pending" || leave.status === "approved") && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={mutations.busy}
                            onClick={async () => {
                              try {
                                const data = await hospitalOpsServerApi.leaveImpact(leave.id);
                                setImpact({ leaveId: leave.id, data });
                              } catch {
                                setImpact({
                                  leaveId: leave.id,
                                  data: { total: 0, appointments: [] },
                                });
                              }
                            }}
                          >
                            Impact
                          </Button>
                        )}
                        {canApprove && leave.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              disabled={mutations.busy}
                              onClick={() => void act(() => mutations.reviewLeave(leave.id, true))}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={mutations.busy}
                              onClick={() => void act(() => mutations.reviewLeave(leave.id, false))}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {(leave.status === "pending" || leave.status === "approved") && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={mutations.busy}
                            onClick={() => void act(() => mutations.cancelLeave(leave.id))}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {impact?.leaveId === leave.id && (
                    <TableRow className="bg-surface-muted/60">
                      <TableCell>
                        <div>
                          <p className="mb-2 text-sm font-medium text-ink-700">
                            {impact.data.total} future appointment{impact.data.total === 1 ? "" : "s"} affected — reschedule or cancel them from the Appointments page.
                          </p>
                          {impact.data.appointments.length > 0 && (
                            <ul className="flex flex-col gap-1 text-xs text-ink-500">
                              {impact.data.appointments.slice(0, 5).map((a) => (
                                <li key={a.id}>
                                  {a.date} {a.time} · {a.patientName} · {a.status}
                                </li>
                              ))}
                              {impact.data.total > 5 && <li>…and {impact.data.total - 5} more</li>}
                            </ul>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal open={showRequest} onClose={() => setShowRequest(false)} title="Request Leave">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const form = new FormData(e.currentTarget);
              const result = await mutations.requestLeave({
                hospitalId,
                staffId: (form.get("staffId") as string) || undefined,
                fromDate: form.get("fromDate") as string,
                toDate: form.get("toDate") as string,
                reason: form.get("reason") as string,
              });
              if (result) {
                setShowRequest(false);
                reload();
              }
            })();
          }}
          className="flex flex-col gap-3"
        >
          {can("MANAGE_STAFF") && (
            <label className="block">
              <span className={labelCls}>Staff member</span>
              <select className={inputCls} name="staffId" required defaultValue="">
                <option value="" disabled>
                  Select staff…
                </option>
                {(staff ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role.replace("_", " ")})
                  </option>
                ))}
              </select>
            </label>
          )}
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
            <textarea className={inputCls} name="reason" required rows={2} placeholder="e.g. Approved personal leave" />
          </label>

          {mutations.error && <p className="text-sm text-status-danger">{mutations.error}</p>}
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowRequest(false)} disabled={mutations.busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutations.busy}>
              {mutations.busy ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
