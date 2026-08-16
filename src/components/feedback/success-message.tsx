import type { ReactNode } from "react";

type SuccessMessageProps = {
  message: string;
  children?: ReactNode;
};

export function SuccessMessage({ message, children }: SuccessMessageProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-card border border-status-success-soft bg-status-success-soft p-4"
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-status-success" aria-hidden="true" />
      <div className="flex-1 text-sm text-status-success">{message}</div>
      {children}
    </div>
  );
}
