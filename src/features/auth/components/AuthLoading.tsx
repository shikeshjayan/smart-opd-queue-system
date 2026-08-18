export function AuthLoading({ label = "Checking session..." }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600"
      />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}