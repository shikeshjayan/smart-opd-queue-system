import Link from "next/link";
import type { QuickAction } from "../types/patient.types";

const glyphs: Record<string, string> = {
  token: "T",
  appointments: "A",
  history: "H",
  prescriptions: "P",
  lab: "L",
};

type QuickActionsProps = {
  actions: QuickAction[];
};

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <section aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="text-lg font-semibold text-ink-900">
        Quick Actions
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <li key={action.id}>
            <Link
              href={action.href}
              className="flex h-full flex-col gap-2 rounded-card border border-ink-200 bg-surface p-4 shadow-card transition-colors hover:border-brand-300 focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-btn bg-brand-100 text-lg font-bold text-brand-700"
                aria-hidden="true"
              >
                {glyphs[action.id] ?? action.label[0]}
              </span>
              <span className="text-sm font-medium text-ink-900">{action.label}</span>
              <span className="text-xs text-ink-500">{action.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
