"use client";

import { useState } from "react";
import type { HTMLAttributes } from "react";

type TabsProps = {
  tabs: { value: string; label: string; content: React.ReactNode }[];
  defaultValue?: string;
  className?: string;
};

export function Tabs({ tabs, defaultValue, className = "" }: TabsProps) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.value ?? "");

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1 border-b border-ink-200">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active === tab.value}
            onClick={() => setActive(tab.value)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
              active === tab.value
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-ink-500 hover:text-ink-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{tabs.find((t) => t.value === active)?.content}</div>
    </div>
  );
}

export function TabContent({ ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}
