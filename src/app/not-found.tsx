import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-ink-600">Page not found.</p>
      <Link href="/patient/dashboard">
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  );
}
