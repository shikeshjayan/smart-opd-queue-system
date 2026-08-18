export function NotificationHint() {
  return (
    <section
      aria-labelledby="notification-hint-title"
      className="rounded-card border border-ink-200 bg-surface p-4 shadow-card"
    >
      <p id="notification-hint-title" className="text-sm font-medium text-ink-900">
        Notifications enabled
      </p>
      <p className="mt-0.5 text-sm text-ink-500">
        We&apos;ll notify you when your turn is approaching.
      </p>
    </section>
  );
}
