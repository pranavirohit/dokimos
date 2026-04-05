"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_ONBOARDING_COMPLETE } from "@/types/dokimos";

/**
 * Sends users who have not finished onboarding to `/onboarding`.
 * Query `?app=1` skips the check (for dev / forced entry).
 *
 * Avoids `useSearchParams()` here so client navigations between `/app/*` routes
 * do not suspend the whole layout behind `<Suspense>` (blank flash).
 */
export function AppRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const skipOnboarding =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("app") === "1";
    if (skipOnboarding) {
      setReady(true);
      return;
    }
    try {
      if (localStorage.getItem(STORAGE_ONBOARDING_COMPLETE) !== "1") {
        router.replace("/onboarding");
        return;
      }
    } catch {
      router.replace("/onboarding");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#FAFAF9]" aria-hidden />
    );
  }

  return <>{children}</>;
}
