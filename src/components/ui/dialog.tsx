"use client";

import { useEffect } from "react";
import type { HTMLAttributes, ReactNode } from "react";

type DialogProps = HTMLAttributes<HTMLDivElement> & {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Dialog({ open, onClose, title, children, className = "", ...props }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-md rounded-card bg-surface p-6 shadow-token ${className}`}
        {...props}
      >
        {title && <h2 className="mb-4 text-lg font-semibold text-ink-900">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
