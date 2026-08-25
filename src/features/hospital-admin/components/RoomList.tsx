"use client";

import { useState } from "react";
import type { Room, RoomType } from "@/types";
import { useAsync } from "@/lib/use-async";
import { hospitalOpsServerApi } from "../api/hospital-ops.server";
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

const ROOM_TYPES: Array<{ value: RoomType; label: string }> = [
  { value: "opd", label: "OPD" },
  { value: "lab", label: "Laboratory" },
  { value: "radiology", label: "Radiology" },
  { value: "procedure", label: "Procedure" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "other", label: "Other" },
];

function RoomFormDialog({
  open,
  hospitalId,
  departments,
  entry,
  onClose,
  onSaved,
}: {
  open: boolean;
  hospitalId: string;
  departments: Array<{ id: string; name: string }>;
  entry: Room | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Room>>(
    entry ?? { hospitalId, code: "", type: "opd", status: "active" }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await hospitalOpsServerApi.saveRoom({
        id: form.id,
        hospitalId,
        code: form.code ?? "",
        name: form.name || undefined,
        type: (form.type as RoomType) ?? "opd",
        departmentId: form.departmentId ?? null,
        floor: form.floor || undefined,
        status: form.status ?? "active",
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={entry ? `Edit ${entry.code}` : "Add Room"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>Room code</span>
            <input
              className={`${inputCls} uppercase`}
              required
              maxLength={12}
              value={form.code ?? ""}
              placeholder="e.g. OPD-04"
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Name (optional)</span>
            <input
              className={inputCls}
              value={form.name ?? ""}
              placeholder="e.g. Consultation 4"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Type</span>
            <select
              className={inputCls}
              value={form.type ?? "opd"}
              onChange={(e) => setForm({ ...form, type: e.target.value as RoomType })}
            >
              {ROOM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Department</span>
            <select
              className={inputCls}
              value={form.departmentId ?? ""}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value || null })}
            >
              <option value="">— Unassigned —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Floor / block</span>
            <input
              className={inputCls}
              value={form.floor ?? ""}
              placeholder="e.g. Ground floor"
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Status</span>
            <select
              className={inputCls}
              value={form.status ?? "active"}
              onChange={(e) => setForm({ ...form, status: e.target.value as Room["status"] })}
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        {error && (
          <p className="text-sm text-status-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !form.code?.trim()}>
            {busy ? "Saving..." : "Save Room"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function RoomList({
  hospitalId,
  departments,
}: {
  hospitalId: string;
  departments: Array<{ id: string; name: string }>;
}) {
  const { data: rooms, isLoading, reload } = useAsync(
    () => hospitalOpsServerApi.listRooms(hospitalId),
    [hospitalId]
  );
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Room | null>(null);
  const [busyId, setBusyId] = useState<string>("");
  const { can } = usePermissions();
  const canManage = can("MANAGE_ROOMS");

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">Physical consultation and diagnostic rooms.</p>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setShowForm(true);
            }}
          >
            + Add Room
          </Button>
        )}
      </div>

      {!rooms || rooms.length === 0 ? (
        <EmptyState title="No rooms configured" description="Add rooms like OPD-01, LAB-01 or XRAY-01." />
      ) : (
        <>
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-muted hover:bg-surface-muted">
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-mono text-xs font-semibold text-ink-900">{room.code}</TableCell>
                      <TableCell className="text-ink-700">{room.name || "—"}</TableCell>
                      <TableCell className="text-ink-700 capitalize">{room.type}</TableCell>
                      <TableCell className="text-ink-700">
                        {room.departmentId
                          ? departments.find((d) => d.id === room.departmentId)?.name ?? room.departmentId
                          : "Unassigned"}
                      </TableCell>
                      <TableCell className="text-xs text-ink-500">{room.floor || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            room.status === "active" ? "success" : room.status === "maintenance" ? "warning" : "danger"
                          }
                        >
                          {room.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditTarget(room);
                                setShowForm(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === room.id}
                              onClick={async () => {
                                setBusyId(room.id);
                                await hospitalOpsServerApi.setRoomStatus(
                                  room.id,
                                  room.status === "active" ? "inactive" : "active"
                                );
                                await reload();
                                setBusyId("");
                              }}
                            >
                              {room.status === "active" ? "Disable" : "Enable"}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {rooms.map((room) => (
              <li key={room.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold text-ink-900">{room.code}</p>
                    <p className="mt-0.5 text-xs capitalize text-ink-500">
                      {room.type} · {room.departmentId
                        ? departments.find((d) => d.id === room.departmentId)?.name ?? ""
                        : "Unassigned"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      room.status === "active" ? "success" : room.status === "maintenance" ? "warning" : "danger"
                    }
                  >
                    {room.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <RoomFormDialog
        open={showForm}
        hospitalId={hospitalId}
        departments={departments}
        entry={editTarget}
        onClose={() => setShowForm(false)}
        onSaved={() => void reload()}
      />
    </div>
  );
}
