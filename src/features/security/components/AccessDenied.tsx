"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type AccessDeniedProps = {
  title?: string;
  message?: string;
  children?: ReactNode;
};

export function AccessDenied({
  title = "Access Restricted",
  message = "You don't have permission to view this information.",
  children,
}: AccessDeniedProps) {
  return (
    <section
      role="alert"
      aria-labelledby="access-denied-title"
      className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-card border border-ink-200 bg-surface p-8 text-center shadow-card"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-status-danger-soft text-xl text-status-danger"
      >
        ⛔
      </span>
      <h1 id="access-denied-title" className="text-lg font-semibold text-ink-900">
        {title}
      </h1>
      <p className="text-sm text-ink-500">{message}</p>
      {children ?? (
        <Link
          href="/login"
          className="rounded-btn bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          Back to sign in
        </Link>
      )}
    </section>
  );
}
