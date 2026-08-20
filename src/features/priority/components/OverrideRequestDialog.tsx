"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PermissionGuard } from "@/features/auth/components/PermissionGuard";

type OverrideRequestDialogProps = {
  open: boolean;
  tokenNumber: string | null;
  patientName: string | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export function OverrideRequestDialog({
  open,
  tokenNumber,
  patientName,
  busy = false,
  error = null,
  onClose,
  onConfirm,
}: OverrideRequestDialogProps) {
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onClose={onClose} title="Request Queue Override">
      <p className="text-sm text-ink-700">
        Request an exception to move{" "}
        <span className="font-mono font-semibold">{tokenNumber}</span>
        {patientName ? ` (${patientName})` : ""} ahead in the queue. An authorized staff member
        must approve the request.
      </p>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-ink-900">Reason</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Why does this token need to move ahead?"
          className="mt-1 w-full rounded-btn border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
        />
      </label>

      {error && (
        <p role="alert" className="mt-3 text-sm text-status-danger">
          {error}
        </p>
      )}

      <PermissionGuard permission="REQUEST_OVERRIDE">
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={busy || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            {busy ? "Submitting…" : "Submit Request"}
          </Button>
        </div>
      </PermissionGuard>
    </Dialog>
  );
}
