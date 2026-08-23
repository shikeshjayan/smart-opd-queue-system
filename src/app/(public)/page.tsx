import Link from "next/link";

export default function PublicPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-card bg-brand-600 text-2xl font-bold text-white"
      >
        SH
      </span>
      <h1 className="mt-6 text-3xl font-bold text-ink-900">Smart Health OPD</h1>
      <p className="mt-2 max-w-md text-ink-500">
        Skip the queue. Get your OPD token online at any government hospital in Kerala.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/patient-login?next=/patient/dashboard"
          className="flex h-12 items-center rounded-btn bg-brand-600 px-6 font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Get OPD Token
        </Link>
        <Link
          href="/login"
          className="flex h-12 items-center rounded-btn border border-ink-300 px-6 font-medium text-ink-700 transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          Login
        </Link>
      </div>
      <p className="mt-10 text-xs text-ink-400">
        Sign-in is required to enter any workspace. Unauthorized access is blocked.
      </p>
    </main>
  );
}
