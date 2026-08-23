"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export type ConsentDialogTarget = {
  id: string;
  purpose: string;
  status: "granted" | "withdrawn" | "expired";
  scopeNote?: string;
};

type ConsentDialogProps = {
  target: ConsentDialogTarget | null;
  onClose: () => void;
  onConfirm: (status: "granted" | "withdrawn") => void;
};

export function ConsentDialog({ target, onClose, onConfirm }: ConsentDialogProps) {
  const [busy, setBusy] = useState(false);
  if (!target) return null;

  const isGranting = target.status !== "granted";

  const handle = (status: "granted" | "withdrawn") => {
    setBusy(true);
    onConfirm(status);
    setBusy(false);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title="Medical record access">
      <dl className="mb-5 flex flex-col gap-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Purpose</dt>
          <dd className="font-medium text-ink-900">{target.purpose}</dd>
        </div>
        {target.scopeNote && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Who can access</dt>
            <dd className="text-ink-700">{target.scopeNote}</dd>
          </div>
        )}
      </dl>
      <p className="mb-6 text-sm text-ink-500">
        {isGranting
          ? "Allowing this purpose lets the named organisation access your medical records. You can withdraw access at any time, and every access is logged."
          : "Withdrawing stops future access under this purpose. Access already recorded in the past remains in your history for audit."}
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        {isGranting ? (
          <>
            <Button variant="ghost" onClick={() => handle("withdrawn")} disabled={busy}>
              Decline
            </Button>
            <Button onClick={() => handle("granted")} disabled={busy}>
              Allow
            </Button>
          </>
        ) : (
          <Button variant="danger" onClick={() => handle("withdrawn")} disabled={busy}>
            Withdraw
          </Button>
        )}
      </div>
    </Dialog>
  );
}
