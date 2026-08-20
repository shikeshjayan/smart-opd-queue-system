type QueuePositionProps = {
  position: number;
};

export function QueuePosition({ position }: QueuePositionProps) {
  return (
    <div className="rounded-card border border-ink-200 bg-surface p-4 text-center shadow-card">
      <p className="text-xs text-ink-500">Your Position</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">{position}</p>
    </div>
  );
}
