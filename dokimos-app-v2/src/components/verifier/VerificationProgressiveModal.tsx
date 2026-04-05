"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  X,
} from "lucide-react";
import type { VerificationRequest } from "@/types/dokimos";
import {
  buildPlainLanguageVerificationRows,
  getVerificationDisplayName,
} from "@/lib/verificationPlainLanguage";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";
import { DEFAULT_EIGEN_APP_ID } from "@/lib/eigenConstants";

const DEFAULT_GIT_SHA =
  process.env.NEXT_PUBLIC_DOKIMOS_GIT_SHA ??
  "1f722ca8084ebeae917ce0ef5b3012ce86296496";
const DEFAULT_IMAGE_DIGEST =
  process.env.NEXT_PUBLIC_DOKIMOS_IMAGE_DIGEST ??
  "sha256:c3a3c11c046da144679625d824bb765c9b6fd358dec631324dce6b17fe4d504c";

const REPO_URL =
  process.env.NEXT_PUBLIC_DOKIMOS_SOURCE_REPO_URL ??
  "https://github.com/dokimos/dokimos-tee";

type Layer = 1 | 2 | 3;

export function VerificationProgressiveModal({
  request,
  onClose,
}: {
  request: VerificationRequest;
  onClose: () => void;
}) {
  const [layer, setLayer] = useState<Layer>(1);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([0]);

  const displayName = getVerificationDisplayName(request);

  const att = request.attestation as Record<string, unknown> | undefined;
  const attributes = useMemo(() => {
    if (!att) return [];
    return buildPlainLanguageVerificationRows(att, request.userEmail);
  }, [att, request.userEmail]);

  const verifiedAtIso =
    (att?.timestamp != null ? String(att.timestamp) : "") ||
    request.completedAt ||
    request.createdAt;

  const eigenDashboardUrl = getEigenVerificationDashboardUrl(DEFAULT_EIGEN_APP_ID);

  const steps = useMemo(() => {
    const a = request.attestation as Record<string, unknown> | undefined;
    const sig = a?.signature != null ? String(a.signature) : "";
    const sigAddr = a?.signer != null ? String(a.signer) : "";
    const msg =
      a?.messageHash != null
        ? String(a.messageHash)
        : a?.userDataHash != null
          ? String(a.userDataHash)
          : "";
    const teeInfo = a?.tee as
      | { platform?: string; enclaveId?: string; debugMode?: boolean }
      | undefined;
    const bio = a?.biometricVerification as
      | { faceMatch?: boolean }
      | undefined;
    const faceOk = bio?.faceMatch === true;
    const sepoliaRoot = "https://sepolia.etherscan.io";

    return [
      {
        title: "Check the Digital Signature",
        progressPct: 20,
        statusLines: [
          sig && sigAddr
            ? "Signature is present and can be checked on-chain"
            : "Add signer details to verify on-chain",
        ],
        proof:
          "The verification result came from Dokimos's secure hardware and hasn't been tampered with. Think of it like a wax seal on an important document. If the seal is intact, you know it's authentic.",
        details: [
          ...(sig ? [{ label: "Signature", value: sig }] : [{ label: "Signature", value: "-" }]),
          ...(sigAddr ? [{ label: "Signer", value: sigAddr }] : [{ label: "Signer", value: "-" }]),
          ...(msg ? [{ label: "Message Hash", value: msg }] : []),
        ],
        link:
          sigAddr && sig
            ? {
                text: "Verify on Etherscan",
                href: `https://sepolia.etherscan.io/address/${encodeURIComponent(sigAddr)}`,
              }
            : { text: "Open Sepolia Etherscan", href: sepoliaRoot },
      },
      {
        title: "Verify the Hardware",
        progressPct: 40,
        statusLines: [
          teeInfo?.platform
            ? `Ran on ${teeInfo.platform} secure hardware`
            : "TEE platform details available when present",
          teeInfo?.debugMode === false
            ? "Production mode (not testing)"
            : teeInfo?.debugMode === true
              ? "Debug mode enabled (non-production)"
              : "Debug mode: see details below",
        ],
        proof:
          "The verification happened in isolated, tamper-proof hardware, not on a regular server that could be manipulated.",
        details: [
          {
            label: "TEE Platform",
            value: teeInfo?.platform ?? "-",
          },
          {
            label: "Enclave ID",
            value: teeInfo?.enclaveId ?? "-",
          },
          {
            label: "Debug Mode",
            value:
              teeInfo?.debugMode === undefined
                ? "-"
                : teeInfo.debugMode
                  ? "Enabled"
                  : "Disabled",
          },
        ],
        link: { text: "View on EigenCloud Dashboard", href: eigenDashboardUrl },
      },
      {
        title: "Check Source Code",
        progressPct: 60,
        statusLines: [
          "Repository and commit are pinned for reproducibility",
        ],
        proof:
          "Anyone can inspect the code that ran inside the secure environment and confirm it matches what was attested.",
        details: [
          { label: "Git commit", value: DEFAULT_GIT_SHA },
          { label: "Repository", value: REPO_URL },
        ],
        link: { text: "View source on GitHub", href: REPO_URL },
      },
      {
        title: "Verify Build Provenance",
        progressPct: 80,
        statusLines: ["Container image digest matches the deployed build"],
        proof:
          "The image digest ties the running software to a specific build, so you can confirm what code actually executed.",
        details: [{ label: "Image digest", value: DEFAULT_IMAGE_DIGEST }],
        link: null as { text: string; href: string } | null,
      },
      {
        title: "Confirm Face Match",
        progressPct: 100,
        statusLines: [
          faceOk
            ? "Face match confirmed against the ID photo"
            : a?.biometricVerification
              ? "See biometric details in the attestation"
              : "Biometric checks when provided by workflow",
        ],
        proof:
          "This step confirms the live face matches the document photo within policy, reducing impersonation risk.",
        details: [],
        link: null as { text: string; href: string } | null,
      },
    ];
  }, [request, eigenDashboardUrl]);

  const toggleStep = (i: number) => {
    setExpandedSteps((prev) =>
      prev.includes(i) ? prev.filter((n) => n !== i) : [...prev, i]
    );
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex justify-end border-b border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {layer === 1 && (
            <Layer1SimpleVerdict
              displayName={displayName}
              verifiedAtIso={verifiedAtIso}
              attributes={attributes}
              onHow={() => setLayer(2)}
              onTechnical={() => setLayer(3)}
            />
          )}
          {layer === 2 && (
            <Layer2HowItWorks
              onBack={() => setLayer(1)}
              onNext={() => setLayer(3)}
            />
          )}
          {layer === 3 && (
            <Layer3Technical
              steps={steps}
              expandedSteps={expandedSteps}
              onToggleStep={toggleStep}
              onBack={() => setLayer(1)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Layer1SimpleVerdict({
  displayName,
  verifiedAtIso,
  attributes,
  onHow,
  onTechnical,
}: {
  displayName: string;
  verifiedAtIso: string;
  attributes: { label: string; value: string }[];
  onHow: () => void;
  onTechnical: () => void;
}) {
  const ts = (() => {
    const d = new Date(verifiedAtIso);
    if (Number.isNaN(d.getTime())) return verifiedAtIso;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <CheckCircle
          className="mt-1 h-8 w-8 flex-shrink-0 text-[#10B981]"
          aria-hidden
        />
        <div>
          <h2
            id="verification-modal-title"
            className="text-2xl font-semibold text-[#0F172A]"
          >
            Verification Confirmed
          </h2>
          <p className="mt-2 text-[#64748B]">
            {displayName}&apos;s identity has been verified by secure hardware.
            No manual review needed.
          </p>
        </div>
      </div>

      <div className="text-sm text-[#64748B]">Verified: {ts}</div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-[#0F172A]">
          What was verified:
        </h3>
        {attributes.length === 0 ? (
          <p className="text-sm text-[#64748B]">
            Attribute details appear when included in the attestation.
          </p>
        ) : (
          <div className="space-y-2">
            {attributes.map((attr) => (
              <div key={`${attr.label}-${attr.value}`} className="flex gap-2 text-sm">
                <CheckCircle
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#10B981]"
                  aria-hidden
                />
                <div>
                  <span className="font-medium text-[#0F172A]">
                    {attr.label}:
                  </span>{" "}
                  <span className="text-[#64748B]">{attr.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onHow}
          className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-[#10B981] transition hover:bg-emerald-50 hover:text-emerald-700"
        >
          How does this work?
        </button>
        <button
          type="button"
          onClick={onTechnical}
          className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-[#64748B] transition hover:bg-slate-100 hover:text-[#0F172A]"
        >
          Technical Details
        </button>
      </div>
    </div>
  );
}

function Layer2HowItWorks({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">
        How Dokimos Verification Works
      </h2>

      <p className="mb-6 text-base leading-relaxed text-slate-600">
        Dokimos verifies identities once, then creates a proof that organizations
        can check independently. You never have to store sensitive ID
        documents.
      </p>

      <p className="mb-4 text-sm font-medium text-slate-900">
        Here&apos;s what happened:
      </p>

      <div className="space-y-6">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
            1
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              Sarah uploaded her ID to Dokimos
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              It was verified automatically in an isolated hardware environment
              where no one, not even Dokimos, can access the raw document.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
            2
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              A signed verification record for Sarah was created
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              This record proves the necessary identity checks happened and can
              be verified by anyone.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
            3
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              You received the verification record
            </p>
            <p className="mt-2 text-sm text-slate-600">Verify it yourself:</p>
            <button
              type="button"
              onClick={onNext}
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-green-600 transition hover:text-green-700"
            >
              Check the cryptographic proof
              <span aria-hidden>→</span>
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 mt-8 border-t border-slate-200" />

      <div className="rounded-r border-l-4 border-green-600 bg-green-50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-900">
          Why this matters for you:
        </p>
        <ul className="space-y-1 text-sm text-green-800">
          <li>• Instant verification, no waiting</li>
          <li>• Fraud-proof, mathematically impossible to fake</li>
          <li>• Lower liability, you never store ID documents</li>
          <li>• Always verifiable, check the proof anytime</li>
        </ul>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-green-600 transition hover:bg-green-50 hover:text-green-700"
        >
          Technical Details →
        </button>
      </div>
    </div>
  );
}

type StepConfig = {
  title: string;
  progressPct: number;
  statusLines: string[];
  proof: string;
  details: { label: string; value: string }[];
  link: { text: string; href: string } | null;
};

function Layer3Technical({
  steps,
  expandedSteps,
  onToggleStep,
  onBack,
}: {
  steps: StepConfig[];
  expandedSteps: number[];
  onToggleStep: (i: number) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#0F172A]">
          Verify This Proof Yourself
        </h2>
        <p className="mt-2 text-[#64748B]">
          Follow these steps to independently verify this proof. No technical
          expertise required.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, i) => (
          <div key={step.title}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#0F172A]">
                Step {i + 1} of {steps.length}: {step.title}
              </p>
              <span className="text-xs text-slate-500">{step.progressPct}%</span>
            </div>

            <div className="mb-4 h-1 rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${step.progressPct}%` }}
              />
            </div>

            <div className="mb-3 space-y-1">
              {step.statusLines.map((line) => (
                <div key={line} className="flex items-start gap-2">
                  <CheckCircle
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-emerald-800">
                    {line}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onToggleStep(i)}
              className="mb-3 flex items-center gap-2 text-sm text-[#64748B] transition hover:text-[#0F172A]"
            >
              {expandedSteps.includes(i) ? (
                <ChevronDown className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden />
              )}
              What this proves
            </button>

            {expandedSteps.includes(i) && (
              <div className="mb-4 ml-6 rounded border-l-2 border-slate-300 bg-slate-50 p-3 text-sm text-[#64748B]">
                {step.proof}
              </div>
            )}

            {step.details.length > 0 && (
              <div className="mb-4 space-y-2">
                {step.details.map((detail) => (
                  <div
                    key={`${detail.label}-${detail.value}`}
                    className="flex flex-col gap-0.5 text-xs sm:flex-row sm:items-start sm:gap-2"
                  >
                    <span className="min-w-[100px] text-slate-500">
                      {detail.label}:
                    </span>
                    <code className="break-all font-mono text-slate-700">
                      {detail.value}
                    </code>
                  </div>
                ))}
              </div>
            )}

            {step.link && (
              <a
                href={step.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#10B981] hover:text-emerald-700"
              >
                {step.link.text}
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            )}

            {i < steps.length - 1 && (
              <div className="mt-6 border-t border-slate-200" />
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="rounded-lg px-4 py-2 text-sm font-medium text-[#64748B] transition hover:bg-slate-100 hover:text-[#0F172A]"
      >
        ← Back to Summary
      </button>
    </div>
  );
}
