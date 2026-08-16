export default function VerifyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="rounded-card border border-ink-200 bg-surface p-6 text-center shadow-card">
        <h1 className="text-xl font-semibold text-ink-900">Verify Your Phone</h1>
        <p className="mt-2 text-sm text-ink-500">
          Enter the 6-digit code sent to your mobile number.
        </p>
        <div className="mt-6 flex gap-2 justify-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="h-12 w-10 rounded-btn border border-ink-300 text-center text-lg font-semibold text-ink-900 focus:outline-2 focus:outline-brand-600"
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
