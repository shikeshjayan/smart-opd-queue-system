"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authMockApi } from "../api/auth.mock";
import { useAuth } from "../hooks/useAuth";
import { destinationFor } from "../roles";

function nextFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("next");
}

export function StaffLoginForm() {
  const router = useRouter();
  const { authorize } = useAuth();
  const [next] = useState(nextFromUrl);
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const sessionUser = await authMockApi.staffLogin(staffId, password);
      if (!sessionUser) {
        setError("Invalid staff ID or password. Try doc_001 / doctor123.");
        return;
      }
      authorize(sessionUser);
      router.push(destinationFor(sessionUser.role, next));
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-card border border-ink-200 bg-surface p-6 shadow-card">
      <h1 className="text-xl font-semibold text-ink-900">Staff Sign In</h1>
      <p className="mt-1 text-sm text-ink-500">
        Sign in with your staff ID and password. Your role and hospital/district scope are taken from
        your authorized account — not from any role selector.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Staff ID</span>
          <Input
            required
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            placeholder="doc_001"
            autoComplete="username"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Password</span>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-status-danger">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in..." : "Sign In"}
        </Button>
        <p className="text-center text-sm text-ink-500">
          <Link href="/login" className="text-brand-700 hover:underline">
            Back to sign-in options
          </Link>
        </p>
      </form>
    </div>
  );
}