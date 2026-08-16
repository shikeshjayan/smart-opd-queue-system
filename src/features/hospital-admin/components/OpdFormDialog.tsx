"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { Department } from "@/types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type OpdFormInput = {
  departmentId: string;
  name: string;
  startTime: string;
  endTime: string;
};

type OpdFormDialogProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  departments: Department[];
  onSubmit: (input: OpdFormInput) => void;
  onClose: () => void;
};

export function OpdFormDialog({
  open,
  busy,
  error,
  departments,
  onSubmit,
  onClose,
}: OpdFormDialogProps) {
  const [departmentId, setDepartmentId] = useState("");
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!departmentId || !name.trim() || !startTime || !endTime) return;
    onSubmit({
      departmentId,
      name: name.trim(),
      startTime,
      endTime,
    });
    setDepartmentId("");
    setName("");
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add OPD Session">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <span className="mb-1 block text-sm font-medium text-ink-700">Session name</span>
          <Input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Evening OPD"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Start time</span>
            <Input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">End time</span>
            <Input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>
        </div>
        {error && <p className="text-sm text-status-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !name.trim() || !departmentId}>
            {busy ? "Adding..." : "Add OPD"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
