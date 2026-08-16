import type { ReactNode } from "react";

type LoadingStateProps = {
  message?: string;
  rows?: number;
  children?: ReactNode;
};

export function LoadingState({ message = "Loading...", rows = 3, children }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 p-8"
    >
      {children ?? (
        <div className="flex w-full max-w-md flex-col gap-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-ink-100" />
          ))}
        </div>
      )}
      <p className="text-sm text-ink-500">{message}</p>
    </div>
  );
}
