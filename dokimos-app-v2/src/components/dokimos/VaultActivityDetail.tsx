"use client";

import { useMemo } from "react";
import Link from "next/link";
import { vaultDetailTitleClass, vaultInsetPanelClass, vaultPlaidDetailCardClass } from "@/lib/vaultDetailPlaid";
import type { VerificationRequest } from "@/types/dokimos";
import {
  formatVerificationAttributeKey,
  getCompanyBadgeColor,
  getDisplayedAttributeKeys,
} from "@/lib/verificationRequestDisplay";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

type VaultActivityDetailProps = {
  allRequests: VerificationRequest[];
};

function approvalTimestamp(r: VerificationRequest): string {
  const ts = r.completedAt || r.createdAt;
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function VaultActivityDetail({ allRequests }: VaultActivityDetailProps) {
  const approvedRequests = useMemo(() => {
    return [...allRequests]
      .filter((r) => r.status === "approved")
      .sort(
        (a, b) =>
          new Date(b.completedAt || b.createdAt).getTime() -
          new Date(a.completedAt || a.createdAt).getTime()
      )
      .slice(0, 12);
  }, [allRequests]);

  return (
    <div className="w-full">
      <div className={vaultPlaidDetailCardClass}>
        <div className="px-6 pb-2 pt-8 text-center sm:px-8 sm:pt-10">
          <h2 className={vaultDetailTitleClass} style={{ fontFamily: sans }}>
            Activity
          </h2>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
          <div className={`overflow-hidden ${vaultInsetPanelClass}`}>
            {approvedRequests.length === 0 ? (
              <p
                className="px-4 py-8 text-center text-[14px] text-slate-500 sm:px-5"
                style={{ fontFamily: sans }}
              >
                When you approve a verification request, it will appear here with what was shared and when.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {approvedRequests.map((r) => {
                  const initial = (r.verifierName ?? "?").charAt(0).toUpperCase();
                  const badgeColor = getCompanyBadgeColor(r.verifierName ?? "");
                  const keys = getDisplayedAttributeKeys(r);
                  const labels = keys.map(formatVerificationAttributeKey);
                  const when = approvalTimestamp(r);

                  return (
                    <li key={r.requestId}>
                      <div className="flex items-start gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-white shadow-sm"
                          style={{ backgroundColor: badgeColor, fontFamily: sans }}
                          aria-hidden
                        >
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-[15px] font-semibold leading-snug text-slate-900"
                            style={{ fontFamily: sans }}
                          >
                            {r.verifierName || "Organization"}
                          </p>
                          <p
                            className="mt-1 text-[13px] leading-snug text-slate-600"
                            style={{ fontFamily: sans }}
                          >
                            {labels.length > 0
                              ? labels.join(" · ")
                              : "Verification approved"}
                          </p>
                        </div>
                        <time
                          dateTime={r.completedAt || r.createdAt}
                          className="shrink-0 pt-0.5 text-right text-[12px] text-slate-500 sm:text-[13px]"
                          style={{ fontFamily: sans }}
                        >
                          {when}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href="/app/requests"
            className="block text-center text-[13px] font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
            style={{ fontFamily: sans }}
          >
            See all in Activity →
          </Link>
        </div>
      </div>
    </div>
  );
}
