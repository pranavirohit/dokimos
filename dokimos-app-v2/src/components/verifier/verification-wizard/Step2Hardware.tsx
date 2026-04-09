"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import type { WizardAttestation } from "@/components/verifier/verification-wizard/wizardAttestation";

interface Step2HardwareProps {
  attestation: WizardAttestation;
  onNext: () => void;
}

export default function Step2Hardware({
  attestation,
  onNext,
}: Step2HardwareProps) {
  const [showProof, setShowProof] = useState(true);
  const [showTechnical, setShowTechnical] = useState(false);

  const tee = attestation.tee ?? {};
  const quotePresent = Boolean(tee.quote && String(tee.quote).length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Verify the Hardware
        </h2>
      </div>

      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
        <h3 className="font-semibold text-violet-900">What is Intel TDX?</h3>
        <p className="mt-2 text-sm text-violet-900/90">
          Intel TDX (Trust Domain Extensions) helps run workloads in a
          hardware-isolated environment so that host software has a harder time
          observing or tampering with what runs inside.
        </p>
        <p className="mt-2 text-sm text-violet-900/90">
          <strong>Think of it as:</strong> a locked execution area on the CPU
          designed for high-assurance workloads—not a generic VM by itself.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">
          The attestation includes:
        </p>

        <div className="flex items-start gap-3">
          <CheckCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              Platform: {tee.platform ?? "—"}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              Indicates the reported TEE / platform label from the payload.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              Status: {tee.tcbStatus ?? "—"}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              Health / TCB-style signal when provided by the demo backend.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              TEE quote: {quotePresent ? "Present" : "Not available"}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              A quote may be included for hardware attestation workflows.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setShowTechnical(!showTechnical)}
          className="flex w-full items-center justify-between p-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <span>View technical details</span>
          {showTechnical ? (
            <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
          )}
        </button>

        {showTechnical && (
          <div className="space-y-2 border-t border-slate-100 px-3 pb-3 pt-2 font-mono text-xs text-slate-800">
            {tee.mrenclave ? (
              <div>
                <span className="text-slate-500">MRENCLAVE:</span>
                <p className="break-all">{tee.mrenclave}</p>
              </div>
            ) : null}
            {tee.mrsigner ? (
              <div>
                <span className="text-slate-500">MRSIGNER:</span>
                <p className="break-all">{tee.mrsigner}</p>
              </div>
            ) : null}
            {tee.quote ? (
              <div>
                <span className="text-slate-500">Quote (prefix):</span>
                <p className="break-all">
                  {String(tee.quote).slice(0, 120)}
                  {String(tee.quote).length > 120 ? "…" : ""}
                </p>
              </div>
            ) : (
              <p className="text-slate-500">No quote in this payload.</p>
            )}
          </div>
        )}
      </div>

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
                <p className="font-semibold text-slate-900">
                  Stronger isolation story
                </p>
                <p className="mt-1">
                  The payload claims execution metadata consistent with a TEE-style
                  deployment (demo uses simulated fields in places).
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div>
                <p className="font-semibold text-slate-900">Reviewable artifacts</p>
                <p className="mt-1">
                  Technical fields can be compared against vendor documentation and
                  your security review pack.
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
          Continue to Step 3 →
        </button>
      </div>
    </div>
  );
}
