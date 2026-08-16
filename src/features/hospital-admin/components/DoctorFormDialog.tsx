"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { Department } from "@/types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type DoctorFormInput = {
  departmentId: string;
  name: string;
  speciality: string;
  phone: string;
  email: string;
};

type DoctorFormDialogProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  departments: Department[];
  onSubmit: (input: DoctorFormInput) => void;
  onClose: () => void;
};

export function DoctorFormDialog({
  open,
  busy,
  error,
  departments,
  onSubmit,
  onClose,
}: DoctorFormDialogProps) {
  const [departmentId, setDepartmentId] = useState("");
  const [name, setName] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!departmentId || !name.trim()) return;
    onSubmit({
      departmentId,
      name: name.trim(),
      speciality: speciality.trim() || "General Medicine",
      phone: phone.trim() || "—",
      email: email.trim() || "—",
    });
    setDepartmentId("");
    setName("");
    setSpeciality("");
    setPhone("");
    setEmail("");
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add Doctor">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Full name</span>
          <Input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Smitha Raj"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Department</span>
          <Select
            required
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Speciality</span>
          <Input
            value={speciality}
            onChange={(e) => setSpeciality(e.target.value)}
            placeholder="e.g. Cardiology"
          />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Phone</span>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 ..."
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Email</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.gov.in"
            />
          </label>
        </div>
        {error && <p className="text-sm text-status-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !name.trim() || !departmentId}>
            {busy ? "Adding..." : "Add Doctor"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
