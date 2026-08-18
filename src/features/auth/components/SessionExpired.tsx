"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type SessionExpiredProps = {
  children?: ReactNode;
  onSignIn?: () => void;
};

export function SessionExpired({ children, onSignIn }: SessionExpiredProps) {
  const router = useRouter();

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 z-50 grid place-items-center bg-surface/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-card border border-ink-200 bg-surface p-6 text-center shadow-card">
          <h2 className="text-lg font-semibold text-ink-900">Your session has expired.</h2>
          <p className="mt-2 text-sm text-ink-600">
            For your security, please sign in again. In-progress work on this screen is preserved in
            memory so you can continue after signing back in.
          </p>
          <Button className="mt-5 w-full" onClick={onSignIn ?? (() => router.push("/login"))}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}