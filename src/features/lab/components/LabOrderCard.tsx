import { useState } from "react";
import Link from "next/link";
import type { DiagnosticOrder } from "@/services/diagnostics/types";
import { useSpecimen } from "@/features/diagnostics/hooks/useDiagnosticOrders";
import { useDiagnosticResultActions } from "@/features/diagnostics/hooks/useDiagnosticResults";
import { DiagnosticOrderSummary } from "@/features/diagnostics/components/DiagnosticOrderSummary";
import { SpecimenStatus } from "@/features/diagnostics/components/SpecimenStatus";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const SAMPLE_TYPES = ["Blood", "Urine", "Sputum", "Stool", "Image", "Other"];
const REJECT_REASONS = [
  "Insufficient sample",
  "Incorrect container",
  "Sample damaged",
  "Other",
];

type LabOrderCardProps = {
  order: DiagnosticOrder;
  patientName: string;
  onChanged: () => void;
};

export function LabOrderCard({ order, patientName, onChanged }: LabOrderCardProps) {
  const specimen = useSpecimen(order.id);
  const { collect, reject, process, running, error } = useDiagnosticResultActions();
  const [collectOpen, setCollectOpen] = useState(false);
  const [sampleType, setSampleType] = useState(SAMPLE_TYPES[0]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);

  const busy = specimen.isLoading;

  const confirmCollect = async () => {
    const ok = await collect(order.id, sampleType);
    setCollectOpen(false);
    if (ok) onChanged();
  };

  const confirmReject = async () => {
    const ok = await reject(order.id, rejectReason);
    setRejectOpen(false);
    if (ok) onChanged();
  };

  return (
    <div className="flex flex-col gap-2">
      <DiagnosticOrderSummary
        order={order}
        patientName={patientName}
        actions={
          <>
            {order.status === "ordered" && (
              <>
                <Button size="sm" disabled={running ? true : false} onClick={() => setCollectOpen(true)}>
                  Collect
                </Button>
                <Button size="sm" variant="outline" disabled={running ? true : false} onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </>
            )}
            {order.status === "sample_collected" && (
              <>
                <Button size="sm" disabled={running ? true : false} onClick={() => void process(order.id).then((ok) => ok && onChanged())}>
                  Start processing
                </Button>
                <Button size="sm" variant="outline" disabled={running ? true : false} onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </>
            )}
            {(order.status === "processing" || order.status === "sample_collected") && (
              <Link
                href={`/lab/results/${order.id}`}
                className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
              >
                Enter results
              </Link>
            )}
            {order.status === "completed" && (
              <Link
                href={`/lab/results/${order.id}`}
                className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
              >
                View result
              </Link>
            )}
          </>
        }
      />
      {busy ? (
        <Skeleton className="h-8 w-32" />
      ) : specimen.data ? (
        <p className="flex flex-wrap items-center gap-2 px-1 text-xs text-ink-500">
          Specimen {specimen.data.id} · {specimen.data.type}
          <SpecimenStatus status={specimen.data.status} />
          {specimen.data.rejectionReason && (
            <span className="text-status-danger">Rejected: {specimen.data.rejectionReason}</span>
          )}
        </p>
      ) : null}
      {error && <p className="px-1 text-xs text-status-danger">{error}</p>}

      <Dialog open={collectOpen} onClose={() => setCollectOpen(false)} title="Confirm sample collection">
        <p className="text-sm text-ink-700">
          Order {order.id} · {order.items.map((i) => i.testName).join(", ")}
        </p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-ink-900">Sample type</span>
          <select
            className="h-11 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900 focus:outline-2 focus:outline-brand-600"
            value={sampleType}
            onChange={(e) => setSampleType(e.target.value)}
          >
            {SAMPLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setCollectOpen(false)}>
            Cancel
          </Button>
          <Button disabled={running ? true : false} onClick={confirmCollect}>
            Confirm Collection
          </Button>
        </div>
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} title="Record sample rejection">
        <p className="text-sm text-ink-700">
          The rejected specimen is retained in the record and a new collection can be requested.
        </p>
        <fieldset className="mt-4 flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-ink-900">Reason</legend>
          {REJECT_REASONS.map((reason) => (
            <label key={reason} className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="radio"
                name="reject-reason"
                value={reason}
                checked={rejectReason === reason}
                onChange={() => setRejectReason(reason)}
              />
              {reason}
            </label>
          ))}
        </fieldset>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setRejectOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={running ? true : false} onClick={confirmReject}>
            Record Rejection
          </Button>
        </div>
      </Dialog>
    </div>
  );
}