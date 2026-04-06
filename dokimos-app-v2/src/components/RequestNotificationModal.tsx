"use client";

import { X } from "lucide-react";
import type { VerificationRequest } from "@/types/dokimos";
import { workflowDisplayName } from "@/lib/workflowDisplayName";

function formatRequestAttributeName(attr: string): string {
  const map: Record<string, string> = {
    name: "Full Name",
    fullName: "Full Name",
    ageOver18: "Age Over 18",
    ageOver21: "Age Over 21",
    notExpired: "Document Not Expired",
    documentNotExpired: "Document Not Expired",
    dateOfBirth: "Date of Birth",
    nationality: "Nationality",
    documentType: "Document Type",
    documentExpiryDate: "Document Expiry Date",
    address: "Address",
  };
  return map[attr] || attr.replace(/_/g, " ");
}

type RequestNotificationModalProps = {
  request: VerificationRequest | null;
  open: boolean;
  onClose: () => void;
  onReview: () => void;
};

export function RequestNotificationModal({
  request,
  open,
  onClose,
  onReview,
}: RequestNotificationModalProps) {
  const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;
  const serif = "var(--font-instrument-serif), Georgia, serif" as const;

  if (!request) return null;

  const wf = workflowDisplayName(request.workflow);
  const attrs = request.requestedAttributes ?? [];

  return (
    <>
      <div
        role="presentation"
        className={`fixed inset-0 z-[200] bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-[201] max-h-[80vh] overflow-y-auto rounded-t-[20px] border border-slate-200/90 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl transition-transform duration-300 ease-out md:left-1/2 md:max-w-lg md:-translate-x-1/2 ${
          open ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-labelledby="req-notif-title"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id="req-notif-title"
            className="text-[1.125rem] font-semibold leading-tight text-slate-900"
            style={{ fontFamily: serif }}
          >
            Verification request
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 pb-4">
          <div
            className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-dokimos-accent text-[24px] font-semibold text-white shadow-sm"
            style={{ fontFamily: sans }}
            aria-hidden
          >
            {(request.verifierName ?? "?").charAt(0).toUpperCase()}
          </div>
          <h3
            className="text-center text-[1.0625rem] font-semibold text-slate-900"
            style={{ fontFamily: sans }}
          >
            {request.verifierName ?? "Organization"}
          </h3>
        </div>

        <p
          className="mb-5 text-center text-[14px] leading-relaxed text-slate-600"
          style={{ fontFamily: sans }}
        >
          {request.verifierName ?? "This organization"} wants to verify your identity
          {request.workflow ? ` for ${wf}.` : "."}
        </p>

        <div className="mb-6 rounded-xl bg-slate-50 px-4 py-3">
          <p
            className="mb-2 text-[13px] font-medium text-slate-600"
            style={{ fontFamily: sans }}
          >
            They&apos;re requesting:
          </p>
          <ul className="space-y-2">
            {attrs.length === 0 ? (
              <li className="text-[14px] text-slate-500" style={{ fontFamily: sans }}>
                Standard verification details
              </li>
            ) : (
              attrs.map((attr) => (
                <li
                  key={attr}
                  className="flex items-start gap-2 text-[14px] text-slate-900"
                  style={{ fontFamily: sans }}
                >
                  <span className="mt-0.5 font-bold text-dokimos-accent" aria-hidden>
                    •
                  </span>
                  <span>{formatRequestAttributeName(attr)}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl bg-slate-100 text-[15px] font-medium text-slate-800 transition-colors hover:bg-slate-200"
            style={{ fontFamily: sans }}
          >
            Later
          </button>
          <button
            type="button"
            onClick={onReview}
            className="h-12 flex-1 rounded-xl bg-slate-900 text-[15px] font-semibold text-white transition-colors hover:bg-slate-800"
            style={{ fontFamily: sans }}
          >
            Review request →
          </button>
        </div>
      </div>
    </>
  );
}
