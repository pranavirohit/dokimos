"use client";

import { useMemo } from "react";
import { Check, XCircle } from "lucide-react";
import { DokimosSection, DokimosSurfaceCard } from "@/components/dokimos/DokimosPageChrome";
import {
  VAULT_DEMO_ATTRIBUTES,
  VAULT_ATTR_LABELS,
  formatVaultAttributeDisplay,
  groupVaultAttributes,
} from "@/lib/vaultAttributes";
import type { AttestationData } from "@/types/dokimos";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

type VaultIdentityDetailProps = {
  attestationData: AttestationData | null;
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  hasEncryptedId: boolean;
  reVerifyLoading: boolean;
  reVerifyError: string | null;
  onReVerify: () => void;
};

export function VaultIdentityDetail({
  attestationData,
  sessionStatus,
  hasEncryptedId,
  reVerifyLoading,
  reVerifyError,
  onReVerify,
}: VaultIdentityDetailProps) {
  const attributes = useMemo(
    () => attestationData?.attributes ?? VAULT_DEMO_ATTRIBUTES,
    [attestationData]
  );

  const documentTypeHeading = useMemo(() => {
    const v = attributes.documentType;
    if (typeof v !== "string" || !v.trim() || v === "Unknown") return null;
    return formatVaultAttributeDisplay("documentType", v);
  }, [attributes]);

  const cardAttributeEntries = useMemo(
    () => Object.entries(attributes).filter(([k]) => k !== "documentType"),
    [attributes]
  );

  const groupedAttributes = useMemo(
    () => groupVaultAttributes(cardAttributeEntries as [string, string | boolean][]),
    [cardAttributeEntries]
  );

  const timestamp = attestationData?.timestamp
    ? new Date(attestationData.timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

  const renderAttributeGrid = (entries: [string, string | boolean][]) =>
    entries.map(([key, value], idx) => {
      const label = VAULT_ATTR_LABELS[key] || key;
      const displayValue = formatVaultAttributeDisplay(key, value);
      const isVerified = typeof value === "boolean" && value;
      return (
        <div
          key={`${key}-${idx}`}
          className="flex items-center gap-4 rounded-xl border border-slate-200/90 bg-slate-50/50 px-4 py-3.5 sm:py-4"
        >
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500"
              style={{ fontFamily: sans }}
            >
              {label}
            </p>
            <p
              className={`mt-1 text-[15px] font-semibold leading-snug sm:text-[16px] ${
                isVerified ? "text-emerald-700" : "text-slate-900"
              }`}
              style={{ fontFamily: sans }}
            >
              {displayValue}
            </p>
          </div>
        </div>
      );
    });

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: sans }}>
        Your verified identity
      </h2>
      <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-slate-600" style={{ fontFamily: sans }}>
        These attributes have been verified and stored securely.
      </p>

      <div className="mt-8 space-y-8">
        <DokimosSurfaceCard>
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 shadow-sm">
              <Check size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-emerald-800" style={{ fontFamily: sans }}>
                Identity verified
              </p>
              <p className="mt-0.5 text-[13px] text-slate-500" style={{ fontFamily: sans }}>
                {timestamp}
              </p>
              {attestationData?.reVerified ? (
                <p className="mt-1 text-[12px] font-medium text-emerald-700" style={{ fontFamily: sans }}>
                  Refreshed from your stored ID (re-verification)
                </p>
              ) : null}
            </div>
          </div>

          {attestationData?.biometricVerification ? (
            <div
              className={`mt-6 flex items-start gap-3 rounded-xl border px-4 py-3 ${
                attestationData.biometricVerification.faceMatch
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-amber-200 bg-amber-50/70"
              }`}
            >
              {attestationData.biometricVerification.faceMatch ? (
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" strokeWidth={2.5} />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" strokeWidth={2.5} />
              )}
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: sans }}>
                  {attestationData.biometricVerification.faceMatch
                    ? "Face matched to ID"
                    : "Face match check did not pass"}
                </p>
                <p className="mt-1 text-[12px] text-slate-600" style={{ fontFamily: sans }}>
                  Confidence {(attestationData.biometricVerification.confidence * 100).toFixed(1)}%
                  {attestationData.biometricVerification.error
                    ? ` — ${attestationData.biometricVerification.error}`
                    : ""}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 border-t border-slate-100 pt-6">
            {documentTypeHeading ? (
              <div className="mb-4">
                <p
                  className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500"
                  style={{ fontFamily: sans }}
                >
                  Document type
                </p>
                <p className="mt-0.5 text-[15px] font-semibold text-slate-900" style={{ fontFamily: sans }}>
                  {documentTypeHeading}
                </p>
              </div>
            ) : null}
            <p className="text-[13px] text-slate-500" style={{ fontFamily: sans }}>
              {cardAttributeEntries.length}{" "}
              {cardAttributeEntries.length === 1 ? "attribute" : "attributes"} verified
            </p>
          </div>
        </DokimosSurfaceCard>

        <div className="space-y-8">
          {groupedAttributes.identity.length > 0 ? (
            <DokimosSection title="Identity" description="What we verified about you.">
              <div className="grid gap-2 sm:grid-cols-2">{renderAttributeGrid(groupedAttributes.identity)}</div>
            </DokimosSection>
          ) : null}

          {(groupedAttributes.document.length > 0 || groupedAttributes.eligibility.length > 0) && (
            <DokimosSection title="Document & eligibility" description="Document timing and age checks.">
              <div className="grid gap-2 sm:grid-cols-2">
                {renderAttributeGrid([...groupedAttributes.document, ...groupedAttributes.eligibility])}
              </div>
            </DokimosSection>
          )}

          {groupedAttributes.other.length > 0 ? (
            <DokimosSection title="Additional checks">
              <div className="grid gap-2 sm:grid-cols-2">{renderAttributeGrid(groupedAttributes.other)}</div>
            </DokimosSection>
          ) : null}
        </div>

        {hasEncryptedId ? (
          <DokimosSurfaceCard className="border-emerald-200/80 bg-emerald-50/50">
            <h3 className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: sans }}>
              Re-verify without re-uploading
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600" style={{ fontFamily: sans }}>
              Your ID image is encrypted and held in the verification service memory (demo) so you can refresh your
              attestation after a new session or device—without uploading again.
            </p>
            {sessionStatus === "authenticated" ? (
              <button
                type="button"
                onClick={onReVerify}
                disabled={reVerifyLoading}
                className="mt-4 h-12 min-h-[44px] w-full rounded-xl border border-emerald-700/30 bg-white text-[14px] font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ fontFamily: sans }}
              >
                {reVerifyLoading ? "Re-verifying…" : "Re-verify identity"}
              </button>
            ) : (
              <p className="mt-3 text-[13px] text-slate-600" style={{ fontFamily: sans }}>
                Sign in with Google to re-verify using your stored ID.
              </p>
            )}
            {reVerifyError ? (
              <p className="mt-3 text-[13px] text-red-600" role="alert" style={{ fontFamily: sans }}>
                {reVerifyError}
              </p>
            ) : null}
          </DokimosSurfaceCard>
        ) : null}
      </div>
    </div>
  );
}
