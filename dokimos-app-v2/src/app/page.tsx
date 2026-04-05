"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { STORAGE_ONBOARDING_COMPLETE } from "@/types/dokimos";

function HomeRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("intro") === "1") {
      router.replace("/onboarding?intro=1");
      return;
    }
    try {
      if (localStorage.getItem(STORAGE_ONBOARDING_COMPLETE) === "1") {
        router.replace("/app/vault");
      } else {
        router.replace("/onboarding");
      }
    } catch {
      router.replace("/onboarding");
    }
  }, [router, searchParams]);

  return <div className="min-h-[100dvh] w-full bg-gray-100" aria-hidden />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={<div className="min-h-[100dvh] w-full bg-gray-100" aria-hidden />}
    >
      <HomeRedirectInner />
    </Suspense>
  );
}
