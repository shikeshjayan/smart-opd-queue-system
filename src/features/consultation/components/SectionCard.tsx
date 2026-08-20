import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  number?: number;
  aside?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, number, aside, children }: SectionCardProps) {
  return (
    <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          {typeof number === "number" && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {number}
            </span>
          )}
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}