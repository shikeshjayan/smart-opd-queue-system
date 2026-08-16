"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router.push("/patient/dashboard"), 300);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-card border border-ink-200 bg-surface p-6 shadow-card"
      >
        <div className="text-center">
          <h1 className="text-xl font-semibold text-ink-900">Login</h1>
          <p className="mt-1 text-sm text-ink-500">Demo login — no real auth yet</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Email</span>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="patient@example.com"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Password</span>
          <Input type="password" required placeholder="Password" defaultValue="demo" />
        </label>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in..." : "Login"}
        </Button>
        <p className="text-center text-sm text-ink-500">
          Don&apos;t have an account?{" "}
          <Link href="/login" className="text-brand-600 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </main>
  );
}
