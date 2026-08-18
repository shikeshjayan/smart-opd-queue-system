import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import type { TokenCancelReason } from "@/features/registration/types/registration.types";

const REASONS: Array<{ value: TokenCancelReason; label: string }> = [
  { value: "patient_requested", label: "Patient requested" },
  { value: "duplicate_token", label: "Duplicate token" },
  { value: "wrong_opd", label: "Wrong OPD" },
  { value: "opd_closed", label: "OPD closed" },
  { value: "technical_issue", label: "Technical issue" },
  { value: "other", label: "Other" },
];

type CancelTokenDialogProps = {
  open: boolean;
  tokenNumber: string;
  patientName: string;
  onClose: () => void;
  onConfirm: (reason: TokenCancelReason) => void;
  busy?: boolean;
};

export function CancelTokenDialog({
  open,
  tokenNumber,
  patientName,
  onClose,
  onConfirm,
  busy,
}: CancelTokenDialogProps) {
  const [reason, setReason] = useState<TokenCancelReason>("patient_requested");

  return (
    <Dialog open={open} onClose={onClose} title="Cancel Token">
      <div className="rounded-card border border-ink-100 bg-ink-100/40 p-3">
        <p className="font-mono font-semibold tabular-nums text-ink-900">{tokenNumber}</p>
        <p className="text-sm text-ink-600">{patientName}</p>
      </div>
      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-ink-700">Reason</span>
        <Select
          value={reason}
          onChange={(e) => setReason(e.target.value as TokenCancelReason)}
          aria-label="Cancellation reason"
        >
          {REASONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </label>
      <p className="mt-3 text-xs text-ink-500">
        Cancelled tokens are kept on record with the reason. Re-issuing creates a new token that
        links back to this one.
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" disabled={busy} onClick={onClose}>
          Keep Token
        </Button>
        <Button variant="danger" disabled={busy} onClick={() => onConfirm(reason)}>
          {busy ? "Cancelling..." : "Cancel Token"}
        </Button>
      </div>
    </Dialog>
  );
}