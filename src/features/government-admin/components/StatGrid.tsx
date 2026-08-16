type StatItem = {
  id: string;
  label: string;
  value: number | string;
  highlight?: boolean;
};

type StatGridProps = {
  items: StatItem[];
};

export function StatGrid({ items }: StatGridProps) {
  return (
    <section aria-labelledby="stat-grid-title">
      <h2 id="stat-grid-title" className="sr-only">
        Key statistics
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-card border p-4 shadow-card ${
              item.highlight ? "border-brand-200 bg-brand-50" : "border-ink-200 bg-surface"
            }`}
          >
            <dt className="text-xs text-ink-500">{item.label}</dt>
            <dd
              className={`mt-1 text-2xl font-bold ${
                item.highlight ? "text-brand-700" : "text-ink-900"
              }`}
            >
              {typeof item.value === "number" ? item.value.toLocaleString("en-IN") : item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
