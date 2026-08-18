import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME } from "@/config/app";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-card bg-brand-600 text-sm font-bold text-white"
        >
          SH
        </span>
        <span className="font-semibold text-ink-900">{APP_NAME}</span>
      </Link>
      <div className="mt-6 w-full max-w-sm">{children}</div>
      <p className="mt-6 text-center text-xs text-ink-400">
        Government hospital OPD network &middot; Kerala
      </p>
    </main>
  );
}