"use client";

import { Suspense, useMemo } from "react";
import { usePathname } from "next/navigation";
import { AppShellLayout } from "@/components/dokimos/AppShellLayout";
import { RequestNotificationsProvider } from "@/contexts/RequestNotificationsContext";
import { AppRouteGuard } from "./AppRouteGuard";

function AppShellWithTabs({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const hideTabBar = useMemo(
    () => pathname.includes("/review") || pathname.includes("/receipt"),
    [pathname]
  );
  return <AppShellLayout hideTabBar={hideTabBar}>{children}</AppShellLayout>;
}

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] w-full bg-[#FAFAF9]" aria-hidden />
      }
    >
      <AppRouteGuard>
        <RequestNotificationsProvider>
          <AppShellWithTabs>{children}</AppShellWithTabs>
        </RequestNotificationsProvider>
      </AppRouteGuard>
    </Suspense>
  );
}
