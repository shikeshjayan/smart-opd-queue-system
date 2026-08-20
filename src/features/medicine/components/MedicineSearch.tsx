import type { Medicine } from "@/services/medicine/types";
import { EmptyState } from "@/components/feedback/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMedicineSearch } from "../hooks/useMedicineSearch";
import { inputCls } from "@/features/consultation/utils/classes";

type MedicineSearchProps = {
  onSelect: (medicine: Medicine) => void;
};

export function MedicineSearch({ onSelect }: MedicineSearchProps) {
  const { query, setQuery, data, isLoading, error } = useMedicineSearch();

  return (
    <div>
      <input
        className={inputCls}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by generic name or brand (e.g. Paracetamol / Calpol)"
        aria-label="Search medicines"
      />
      {query.trim().length === 0 ? (
        <p className="mt-2 text-xs text-ink-500">
          Start typing to search the medicine catalogue.
        </p>
      ) : isLoading ? (
        <div className="mt-2 flex flex-col gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : error ? (
        <p className="mt-2 text-sm text-status-danger">{error}</p>
      ) : data && data.length > 0 ? (
        <ul className="mt-2 max-h-56 overflow-auto rounded-card border border-ink-200">
          {data.map((medicine) => (
            <li key={medicine.id} className="border-b border-ink-100 last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(medicine)}
                className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-brand-50"
              >
                <span className="text-sm font-medium text-ink-900">{medicine.genericName}</span>
                <span className="text-xs text-ink-500">
                  {medicine.form}
                  {medicine.brandNames.length > 0 ? ` · ${medicine.brandNames.join(", ")}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-2">
          <EmptyState
            title="No medicines found"
            description="Try a different generic or brand name."
          />
        </div>
      )}
    </div>
  );
}