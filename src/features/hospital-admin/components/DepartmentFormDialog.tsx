"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DepartmentFormDialogProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onSubmit: (name: string) => void;
  onClose: () => void;
};

export function DepartmentFormDialog({
  open,
  busy,
  error,
  onSubmit,
  onClose,
}: DepartmentFormDialogProps) {
  const [name, setName] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setName("");
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add Department">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Department name</span>
          <Input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ENT"
          />
        </label>
        {error && <p className="text-sm text-status-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !name.trim()}>
            {busy ? "Adding..." : "Add Department"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
