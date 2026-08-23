"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthLoading } from "@/features/auth/components/AuthLoading";
import { LoginChooser } from "@/features/auth/components/LoginChooser";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { roleHome } from "@/features/auth/roles";

export default function LoginPage() {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(roleHome(user.role));
    }
  }, [status, user, router]);

  if (status === "loading") {
    return <AuthLoading />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Welcome</h1>
        <p className="mt-1 text-sm text-ink-500">How would you like to continue?</p>
      </div>
      <LoginChooser />
    </div>
  );
}
