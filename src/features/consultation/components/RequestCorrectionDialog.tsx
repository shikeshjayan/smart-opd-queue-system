import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SuccessMessage } from "@/components/feedback/success-message";

const REQUESTS_KEY = "smart-health.correction-requests";

type RequestCorrectionDialogProps = {
  open: boolean;
  encounterId: string;
  onClose: () => void;
};

export function RequestCorrectionDialog({ open, encounterId, onClose }: RequestCorrectionDialogProps) {
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = () => {
    const requests = JSON.parse(localStorage.getItem(REQUESTS_KEY) ?? "[]") as unknown[];
    requests.push({
      id: `crq_${Date.now()}`,
      encounterId,
      reason: reason.trim() || "Correction requested by clinician",
      requestedAt: new Date().toISOString(),
      status: "open",
    });
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setReason("");
      onClose();
    }, 1200);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Request correction">
      {saved ? (
        <SuccessMessage message="Correction request recorded. It will be reviewed before any change." />
      ) : (
        <>
          <p className="text-sm text-ink-700">
            This record is completed and protected. Requests corrections with a reason; the change is
            reviewed before it is applied to the medical record.
          </p>
          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-medium text-ink-900">Reason for correction</span>
            <textarea
              className="min-h-[5rem] w-full rounded-btn border border-ink-300 bg-surface px-3 py-2 text-sm text-ink-900 focus:outline-2 focus:outline-brand-600"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the correction needed"
            />
          </label>
          <div className="mt-5 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit}>Submit request</Button>
          </div>
        </>
      )}
    </Dialog>
  );
}