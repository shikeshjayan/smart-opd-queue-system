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
          href="/patient/dashboard"
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
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <span className="text-xs uppercase tracking-wide text-ink-400">Demo workspaces</span>
        <Link
          href="/doctor/dashboard"
          className="rounded-full border border-ink-300 px-4 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
        >
          Doctor Workspace
        </Link>
        <Link
          href="/hospital-admin/dashboard"
          className="rounded-full border border-ink-300 px-4 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
        >
          Hospital Admin
        </Link>
        <Link
          href="/district-admin/dashboard"
          className="rounded-full border border-ink-300 px-4 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
        >
          District Admin
        </Link>
        <Link
          href="/state-admin/dashboard"
          className="rounded-full border border-ink-300 px-4 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
        >
          State Admin
        </Link>
      </div>
    </main>
  );
}
