"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPage() {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSent(true);
    }, 300);
  }

  return (
    <div className="rounded-card border border-ink-200 bg-surface p-6 shadow-card">
      <h1 className="text-xl font-semibold text-ink-900">Forgot Password</h1>
      {sent ? (
        <>
          <p className="mt-2 text-sm text-ink-600">
            If an account exists for <span className="font-medium">{identifier}</span>, a reset
            link/code has been sent. Please check your inbox or mobile.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-btn bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Back to Sign In
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">
              Staff ID, email or mobile
            </span>
            <Input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="doc_001 or +91 98470 12345"
            />
          </label>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Sending..." : "Send Reset Instructions"}
          </Button>
          <p className="text-center text-sm text-ink-500">
            <Link href="/login" className="text-brand-700 hover:underline">
              Back to sign-in options
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}