export function QueuePriorityNotice() {
  return (
    <p
      role="note"
      className="rounded-card border border-status-info-soft bg-status-info-soft px-4 py-3 text-sm text-status-info"
    >
      Queue order may change when priority patients require immediate attention.
    </p>
  );
}
