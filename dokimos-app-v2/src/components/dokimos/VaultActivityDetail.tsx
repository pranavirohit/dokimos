"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { VerificationRequest } from "@/types/dokimos";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

type VaultActivityDetailProps = {
  allRequests: VerificationRequest[];
  /** Display time for the baseline “Identity verified” row */
  identityVerifiedTime: string;
};

export function VaultActivityDetail({ allRequests, identityVerifiedTime }: VaultActivityDetailProps) {
  const lines = useMemo(() => {
    const out: { id: string; label: string; time?: string }[] = [
      { id: "identity-verified", label: "Identity verified", time: identityVerifiedTime },
    ];
    const sorted = [...allRequests].sort(
      (a, b) =>
        new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
    );
    for (const r of sorted) {
      if (out.length >= 8) break;
      const t = new Date(r.completedAt || r.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      if (r.status === "pending") {
        out.push({
          id: `req-${r.requestId}`,
          label: `Request pending: ${r.verifierName || "Organization"}`,
          time: t,
        });
      } else if (r.status === "approved") {
        out.push({
          id: `req-${r.requestId}`,
          label: `Verified share: ${r.verifierName || "Organization"}`,
          time: t,
        });
      } else {
        out.push({
          id: `req-${r.requestId}`,
          label: `Declined: ${r.verifierName || "Organization"}`,
          time: t,
        });
      }
    }
    return out;
  }, [allRequests, identityVerifiedTime]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: sans }}>
        Activity &amp; history
      </h2>
      <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-slate-600" style={{ fontFamily: sans }}>
        Recent verification events and requests.
      </p>

      <ul className="mt-8 space-y-3">
        {lines.map((line) => (
          <li
            key={line.id}
            className="flex flex-col border-l-2 border-emerald-200/80 py-1 pl-4"
          >
            <span className="text-[15px] text-slate-800" style={{ fontFamily: sans }}>
              {line.label}
            </span>
            {line.time ? (
              <span className="text-[13px] text-slate-500" style={{ fontFamily: sans }}>
                {line.time}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <Link
        href="/app/requests"
        className="mt-8 inline-flex text-[14px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
        style={{ fontFamily: sans }}
      >
        See all in Activity →
      </Link>
    </div>
  );
}
