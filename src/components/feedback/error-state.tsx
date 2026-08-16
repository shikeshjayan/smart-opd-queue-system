import type { ReactNode } from "react";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  children?: ReactNode;
};

export function ErrorState({ message = "Something went wrong.", onRetry, children }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-card border border-status-danger-soft bg-status-danger-soft p-8">
      {children}
      <p className="text-sm text-status-danger">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-btn border border-status-danger px-4 py-2 text-sm font-medium text-status-danger hover:bg-status-danger-soft"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
