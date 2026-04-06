"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import type { VerificationRequest } from "@/types/dokimos";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

type VaultRequestsDetailProps = {
  pendingRequests: VerificationRequest[];
  requestsLoading: boolean;
  onReviewRequest: (req: VerificationRequest) => void;
};

export function VaultRequestsDetail({
  pendingRequests,
  requestsLoading,
  onReviewRequest,
}: VaultRequestsDetailProps) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: sans }}>
        Pending requests
      </h2>
      <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-slate-600" style={{ fontFamily: sans }}>
        Organizations that have asked to verify your identity. Review and approve what you share.
      </p>

      <div className="mt-8">
        {requestsLoading ? (
          <div
            className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-[14px] text-slate-500"
            style={{ fontFamily: sans }}
          >
            Loading requests…
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
            <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" strokeWidth={1.5} aria-hidden />
            <p className="text-[15px] font-medium text-slate-700" style={{ fontFamily: sans }}>
              Nothing pending
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500" style={{ fontFamily: sans }}>
              When an organization asks for a verified proof, it will show up here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {pendingRequests.map((req) => (
              <li key={req.requestId}>
                <button
                  type="button"
                  onClick={() => onReviewRequest(req)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: sans }}>
                      {req.verifierName || "Verification request"}
                    </p>
                    <p className="mt-0.5 text-[13px] text-slate-500" style={{ fontFamily: sans }}>
                      {req.requestedAttributes.length}{" "}
                      {req.requestedAttributes.length === 1 ? "attribute" : "attributes"} requested
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] font-medium text-emerald-700" style={{ fontFamily: sans }}>
                    Review →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!requestsLoading && pendingRequests.length > 0 ? (
          <Link
            href="/app/requests"
            className="mt-4 block text-center text-[13px] font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
            style={{ fontFamily: sans }}
          >
            Open full activity &amp; history
          </Link>
        ) : null}
      </div>
    </div>
  );
}
