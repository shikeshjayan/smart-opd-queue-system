"use client";

import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/features/registration/hooks/useKeyboardShortcuts";

export function ReceptionShortcuts() {
  const router = useRouter();
  useKeyboardShortcuts({
    search: () => router.push("/reception/patients"),
    newRegistration: () => router.push("/reception/registration"),
  });
  return null;
}