"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-bold">Something went wrong!</h1>
      <p className="text-sm text-ink-500">{error.message}</p>
      <Button variant="primary" onClick={reset}>Try again</Button>
    </div>
  );
}
