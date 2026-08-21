"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { hospitalOpsService } from "@/services/hospital-ops";
import type { OpsStaffRole, StaffProfile } from "@/services/hospital-ops/types";
import { useAsync } from "@/lib/use-async";
import { useOpsMutations } from "../hooks/useHospitalOps";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ROLE_OPTIONS: Array<{ value: OpsStaffRole; label: string }> = [
  { value: "doctor", label: "Doctor" },
  { value: "receptionist", label: "Reception" },
  { value: "nurse", label: "Nursing" },
  { value: "lab_technician", label: "Laboratory" },
  { value: "pharmacist", label: "Pharmacy" },
  { value: "accountant", label: "Accounts" },
  { value: "administrator", label: "Administration" },
];

type StaffFormDialogProps = {
  open: boolean;
  hospitalId: string;
  departments: Array<{ id: string; name: string }>;
  profile: StaffProfile | null;
  onClose: () => void;
  onSaved: () => void;
};

function StaffProfileForm({
  initial,
  departments,
  onClose,
  onSaved,
}: {
  initial: StaffProfile;
  departments: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<StaffProfile>(initial);
  const { saveStaffProfile, nextEmployeeId, busy, error } = useOpsMutations();

  const update = (patch: Partial<StaffProfile>) => setForm({ ...form, ...patch });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = form.id ? form : { ...form, id: `stf_${Date.now()}` };
    const result = await saveStaffProfile(payload);
    if (result) {
      onSaved();
      onClose();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Name</span>
          <input
            className="h-11 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm"
            required
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Employee ID</span>
          <input
            className="h-11 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm font-mono"
            required
            value={form.employeeId}
            onChange={(e) => update({ employeeId: e.target.value.toUpperCase() })}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Role</span>
          <select
            className="h-11 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm"
            value={form.role}
            onChange={(e) => {
              const role = e.target.value as OpsStaffRole;
              update({ role });
              void nextEmployeeId(initial.hospitalId, role).then((id) => {
                if (id) update({ employeeId: id });
              });
            }}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Department</span>
          <select
            className="h-11 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm"
            value={form.departmentId ?? ""}
            onChange={(e) => update({ departmentId: e.target.value || undefined })}
          >
            <option value="">— None —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Phone</span>
          <input
            className="h-11 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm"
            type="tel"
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Email</span>
          <input
            className="h-11 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm"
            type="email"
            value={form.email}
            onChange={(e) => update({ email: e.target.value })}
          />
        </label>
      </div>
      <label className="flex items-center justify-between rounded-btn border border-ink-200 px-3 py-2.5 text-sm">
        <span className="font-medium text-ink-700">Active</span>
        <input
          type="checkbox"
          checked={form.status === "active"}
          onChange={(e) => update({ status: e.target.checked ? "active" : "inactive" })}
        />
      </label>

      {error && <p className="text-sm text-status-danger">{error}</p>}
      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || !form.name.trim()}>
          {busy ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}

export function StaffFormDialog({
  open,
  hospitalId,
  departments,
  profile,
  onClose,
  onSaved,
}: StaffFormDialogProps) {
  const { data: generatedId, isLoading: generating } = useAsync(
    () =>
      open && !profile
        ? hospitalOpsService.nextEmployeeId(hospitalId, "receptionist")
        : Promise.resolve(""),
    [open, profile, hospitalId]
  );

  const blank: StaffProfile = {
    id: "",
    hospitalId,
    employeeId: generatedId ?? "",
    name: "",
    role: "receptionist",
    phone: "",
    email: "",
    status: "active",
    joinedAt: new Date().toISOString().slice(0, 10),
  };

  return (
    <Dialog open={open} onClose={onClose} title={profile ? "Edit Staff Profile" : "Add Staff"}>
      {!profile && generating ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <StaffProfileForm
          key={profile?.id || generatedId || "new"}
          initial={profile ? structuredClone(profile) : blank}
          departments={departments}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Dialog>
  );
}
