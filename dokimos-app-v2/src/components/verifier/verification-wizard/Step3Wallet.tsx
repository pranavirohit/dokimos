"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  Copy,
} from "lucide-react";
import type { WizardAttestation } from "@/components/verifier/verification-wizard/wizardAttestation";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";
import { DEFAULT_EIGEN_APP_ID } from "@/lib/eigenConstants";

interface Step3WalletProps {
  attestation: WizardAttestation;
  onNext: () => void;
}

export default function Step3Wallet({
  attestation,
  onNext,
}: Step3WalletProps) {
  const [showProof, setShowProof] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(attestation.signer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const eigenDashboardUrl =
    attestation.eigen?.verificationUrl ??
    getEigenVerificationDashboardUrl(
      attestation.eigen?.appId ?? DEFAULT_EIGEN_APP_ID
    );

  const appIdPreview =
    typeof attestation.eigen?.appId === "string"
      ? attestation.eigen.appId.slice(0, 10)
      : "—";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Check the Wallet
        </h2>
      </div>

      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <h3 className="font-semibold text-indigo-900">What is this address?</h3>
        <p className="mt-2 text-sm text-indigo-900/90">
          Dokimos signs attestations with a dedicated wallet derived from the
          deployment configuration. You can treat it like a public “signing
          identity” for the service.
        </p>
        <p className="mt-2 text-sm text-indigo-900/90">
          <strong>Think of it as:</strong> a stamp that corresponds to a
          specific key—verifiers can confirm signatures against that address.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-sm font-medium text-slate-800">
          Wallet that signed this attestation:
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="flex-1 break-all rounded border border-slate-200 bg-white px-3 py-2 font-mono text-sm">
            {attestation.signer}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" aria-hidden />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-slate-900">How to verify</h3>
        <ol className="space-y-3 text-sm text-slate-700">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">
              1
            </span>
            <span>Open the EigenCloud dashboard link below.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">
              2
            </span>
            <span>
              Compare any published signer / app wallet with{" "}
              <code className="rounded bg-slate-100 px-1 font-mono text-xs">
                {attestation.signer.slice(0, 10)}…
              </code>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">
              3
            </span>
            <span>
              App id (if shown):{" "}
              <code className="rounded bg-slate-100 px-1 font-mono text-xs">
                {appIdPreview}…
              </code>
            </span>
          </li>
        </ol>
      </div>

      <a
        href={eigenDashboardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        <span>View on EigenCloud Dashboard</span>
        <ExternalLink className="h-4 w-4" aria-hidden />
      </a>

      <div className="rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setShowProof(!showProof)}
          className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50"
        >
          <span className="font-semibold text-slate-900">What this proves</span>
          {showProof ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
          )}
        </button>

        {showProof && (
          <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-2 text-sm text-slate-700">
            <div className="flex gap-3">
              <CheckCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div>
                <p className="font-semibold text-slate-900">Consistent identity</p>
                <p className="mt-1">
                  The signature you verified in Step 1 should match the signer
                  address shown here.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div>
                <p className="font-semibold text-slate-900">Eigen metadata</p>
                <p className="mt-1">
                  When present, Eigen links help you connect the deployment to a
                  public verification surface.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-dokimos-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-dokimos-accentHover"
        >
          Continue to Step 4 →
        </button>
      </div>
    </div>
  );
}
