import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";

export function ConsultationEmptyState() {
  return (
    <EmptyState
      title="No active consultation"
      description="This patient does not have an open consultation right now. Call their token from the OPD queue to start a consultation."
      action={
        <Link
          href="/doctor/queue"
          className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Open OPD Queue
        </Link>
      }
    />
  );
}