"use client";

import { useEffect, useState } from "react";
import { useAsync } from "@/lib/use-async";
import type { DiagnosticCategory, TestCatalogItem } from "@/services/diagnostics/types";
import { diagnosticsMockApi } from "../api/diagnostics.mock";
import { inputCls } from "@/features/consultation/utils/classes";
import { Skeleton } from "@/components/ui/skeleton";

type TestSearchProps = {
  onSelect: (test: TestCatalogItem) => void;
  excludeIds?: string[];
};

const CATEGORY_OPTIONS: Array<{ value: "all" | DiagnosticCategory; label: string }> = [
  { value: "all", label: "All types" },
  { value: "laboratory", label: "Laboratory" },
  { value: "imaging", label: "Imaging" },
  { value: "other", label: "Other" },
];

export function TestSearch({ onSelect, excludeIds = [] }: TestSearchProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | DiagnosticCategory>("all");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(id);
  }, [query]);

  const search = useAsync(
    () =>
      diagnosticsMockApi.searchTests(debounced, category === "all" ? undefined : category),
    [debounced, category]
  );

  const results = (search.data ?? []).filter((test) => !excludeIds.includes(test.id));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          className={`${inputCls} flex-1`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the diagnostic catalogue (e.g. CBC, Glucose, X-Ray)"
          aria-label="Search tests"
        />
        <select
          className={`${inputCls} w-40`}
          value={category}
          onChange={(e) => setCategory(e.target.value as "all" | DiagnosticCategory)}
          aria-label="Filter by diagnostic type"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {query.trim().length === 0 ? (
        <p className="mt-2 text-xs text-ink-500">
          Start typing to search the managed test catalogue.
        </p>
      ) : search.isLoading ? (
        <div className="mt-2 flex flex-col gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : search.error ? (
        <p className="mt-2 text-sm text-status-danger">{search.error}</p>
      ) : results.length === 0 ? (
        <p className="mt-2 text-sm text-ink-500">No tests found. Try a different name.</p>
      ) : (
        <ul className="mt-2 max-h-56 overflow-auto rounded-card border border-ink-200">
          {results.map((test) => (
            <li key={test.id} className="border-b border-ink-100 last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(test)}
                className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-brand-50"
              >
                <span className="text-sm font-medium text-ink-900">{test.name}</span>
                <span className="text-xs capitalize text-ink-500">
                  {test.category} · {test.specimenType}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}