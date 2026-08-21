"use client";

import { useState } from "react";
import type { HospitalServiceEntry } from "@/services/hospital-ops/types";
import { useOpsMutations, useServices } from "../hooks/useHospitalOps";
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

function ServiceFormDialog({
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
  entry: HospitalServiceEntry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<HospitalServiceEntry>(
    entry ?? {
      id: "",
      hospitalId,
      name: "",
      code: "",
      status: "active",
      availability: "",
    }
  );
  const { saveService, busy, error } = useOpsMutations();

  return (
    <Modal open={open} onClose={onClose} title={entry ? "Edit Service" : "Add Service"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void (async () => {
            const payload = form.id ? form : { ...form, id: `svc_${Date.now()}` };
            const result = await saveService(payload);
            if (result) {
              onSaved();
              onClose();
            }
          })();
        }}
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>Name</span>
            <input
              className={inputCls}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Code</span>
            <input
              className={`${inputCls} uppercase`}
              required
              maxLength={10}
              value={form.code}
              placeholder="e.g. XRAY"
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </label>
        </div>
        <label className="block">
          <span className={labelCls}>Department</span>
          <select
            className={inputCls}
            value={form.departmentId ?? ""}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value || undefined })}
          >
            <option value="">— Hospital-wide —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Availability</span>
          <input
            className={inputCls}
            value={form.availability}
            placeholder="e.g. Mon–Sat · 09:00–17:00"
            onChange={(e) => setForm({ ...form, availability: e.target.value })}
          />
        </label>
        <label className="flex items-center justify-between rounded-btn border border-ink-200 px-3 py-2.5 text-sm">
          <span className="font-medium text-ink-700">Active</span>
          <input
            type="checkbox"
            checked={form.status === "active"}
            onChange={(e) => setForm({ ...form, status: e.target.checked ? "active" : "inactive" })}
          />
        </label>

        {error && (
          <p className="text-sm text-status-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !form.name.trim() || !form.code.trim()}>
            {busy ? "Saving..." : "Save Service"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ServiceList({
  hospitalId,
  departments,
}: {
  hospitalId: string;
  departments: Array<{ id: string; name: string }>;
}) {
  const { data: services, isLoading, error, reload } = useServices(hospitalId);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<HospitalServiceEntry | null>(null);
  const { toggleServiceStatus, busy } = useOpsMutations();
  const { can } = usePermissions();
  const canManage = can("MANAGE_SERVICES");

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error) return <EmptyState title="Unable to load services" description={error} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">Services offered by this hospital.</p>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setShowForm(true);
            }}
          >
            + Add Service
          </Button>
        )}
      </div>

      {!services || services.length === 0 ? (
        <EmptyState title="No services configured" description="Add services like Laboratory, X-Ray or Pharmacy." />
      ) : (
        <>
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-muted hover:bg-surface-muted">
                    <TableHead>Service</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium text-ink-900">{service.name}</TableCell>
                      <TableCell className="font-mono text-xs text-ink-500">{service.code}</TableCell>
                      <TableCell className="text-ink-700">
                        {service.departmentId
                          ? departments.find((d) => d.id === service.departmentId)?.name ?? service.departmentId
                          : "Hospital-wide"}
                      </TableCell>
                      <TableCell className="text-xs text-ink-500">{service.availability || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={service.status === "active" ? "success" : "danger"}>{service.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditTarget(service);
                                setShowForm(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={async () => {
                                await toggleServiceStatus(service.id);
                                reload();
                              }}
                            >
                              {service.status === "active" ? "Disable" : "Enable"}
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
            {services.map((service) => (
              <li key={service.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink-900">{service.name}</p>
                    <p className="font-mono text-xs text-ink-400">{service.code}</p>
                  </div>
                  <Badge variant={service.status === "active" ? "success" : "danger"}>{service.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-500">{service.availability || (service.departmentId ?? "")}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <ServiceFormDialog
        open={showForm}
        hospitalId={hospitalId}
        departments={departments}
        entry={editTarget}
        onClose={() => setShowForm(false)}
        onSaved={reload}
      />
    </div>
  );
}
