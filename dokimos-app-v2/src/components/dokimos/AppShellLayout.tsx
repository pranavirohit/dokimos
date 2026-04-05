"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Activity, Settings } from "lucide-react";
import { usePendingRequestCount } from "@/contexts/RequestNotificationsContext";
import type { DokimosAppTab } from "@/types/dokimos";

type AppShellLayoutProps = {
  children: React.ReactNode;
  /** Hide bottom tabs on nested task screens (review / receipt). */
  hideTabBar?: boolean;
  /** Optional header above scroll (e.g. review back bar). */
  topBar?: React.ReactNode;
};

function tabFromPath(pathname: string): DokimosAppTab {
  if (pathname.startsWith("/app/settings")) return "settings";
  if (pathname.startsWith("/app/privacy")) return "settings";
  if (
    pathname.startsWith("/app/requests") &&
    !pathname.includes("/review") &&
    !pathname.includes("/receipt")
  ) {
    return "activity";
  }
  if (pathname.startsWith("/app/vault")) return "vault";
  return "vault";
}

const tabClass = (active: boolean) =>
  `flex min-h-[56px] min-w-[72px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] ${
    active ? "text-[#4F46E5]" : "text-[#6B7280] hover:text-gray-900"
  }`;

export function AppShellLayout({
  children,
  hideTabBar = false,
  topBar,
}: AppShellLayoutProps) {
  const pathname = usePathname() || "";
  const activeTab = tabFromPath(pathname);
  const pendingRequestCount = usePendingRequestCount();
  const sans = "var(--font-instrument-sans), system-ui, sans-serif";

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-white pt-[env(safe-area-inset-top)]">
      {topBar}
      <div className="mx-auto flex min-h-0 w-full max-w-[600px] flex-1 flex-col overflow-hidden lg:max-w-3xl">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">{children}</div>
      </div>
      {!hideTabBar && (
        <nav
          className="h-14 w-full shrink-0 border-t border-[#F3F4F6] bg-white pb-[env(safe-area-inset-bottom)] pt-2"
          aria-label="Main"
        >
          <div className="mx-auto flex h-full max-w-[600px] items-end justify-around px-1 lg:max-w-3xl">
              <Link
                href="/app/vault"
                aria-current={activeTab === "vault" ? "page" : undefined}
                className={tabClass(activeTab === "vault")}
                style={{ fontFamily: sans }}
              >
                <span
                  className={`mb-0.5 block h-1 w-1 rounded-full ${activeTab === "vault" ? "bg-[#4F46E5]" : "bg-transparent"}`}
                  aria-hidden
                />
                <Shield size={20} strokeWidth={activeTab === "vault" ? 2.5 : 2} aria-hidden />
                <span className="text-[11px] font-normal">Vault</span>
              </Link>
              <Link
                href="/app/requests"
                aria-current={activeTab === "activity" ? "page" : undefined}
                className={`${tabClass(activeTab === "activity")} relative`}
                style={{ fontFamily: sans }}
              >
                <span
                  className={`mb-0.5 block h-1 w-1 rounded-full ${activeTab === "activity" ? "bg-[#4F46E5]" : "bg-transparent"}`}
                  aria-hidden
                />
                <span className="relative inline-flex">
                  <Activity size={20} strokeWidth={activeTab === "activity" ? 2.5 : 2} aria-hidden />
                  {pendingRequestCount > 0 ? (
                    <span
                      className="absolute -right-1.5 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-[5px] text-[10px] font-semibold leading-none text-white"
                      aria-label={`${pendingRequestCount} pending request${pendingRequestCount === 1 ? "" : "s"}`}
                    >
                      {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
                    </span>
                  ) : null}
                </span>
                <span className="text-[11px] font-normal">Activity</span>
              </Link>
              <Link
                href="/app/settings"
                aria-current={activeTab === "settings" ? "page" : undefined}
                className={tabClass(activeTab === "settings")}
                style={{ fontFamily: sans }}
              >
                <span
                  className={`mb-0.5 block h-1 w-1 rounded-full ${activeTab === "settings" ? "bg-[#4F46E5]" : "bg-transparent"}`}
                  aria-hidden
                />
                <Settings size={20} strokeWidth={activeTab === "settings" ? 2.5 : 2} aria-hidden />
                <span className="text-[11px] font-normal">Settings</span>
              </Link>
            </div>
        </nav>
      )}
    </div>
  );
}
