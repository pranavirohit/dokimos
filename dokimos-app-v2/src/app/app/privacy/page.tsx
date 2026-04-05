"use client";

import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;
const serif = "var(--font-instrument-serif), Georgia, serif" as const;

export default function PrivacyPage() {
  const router = useRouter();
  const eigenUrl = getEigenVerificationDashboardUrl();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-4 sm:px-6 sm:pt-6">
      <h1
        className="text-center text-[26px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[30px]"
        style={{ fontFamily: serif }}
      >
        Privacy &amp; security
      </h1>
      <p className="mt-3 text-center text-[14px] text-slate-600" style={{ fontFamily: sans }}>
        What Dokimos is designed to protect — and what stays under your control.
      </p>

      <section className="mt-10 space-y-3" style={{ fontFamily: sans }}>
        <h2 className="text-[18px] font-semibold text-slate-900" style={{ fontFamily: serif }}>
          Data minimization
        </h2>
        <p className="text-[14px] leading-relaxed text-slate-600">
          Verification is built around cryptographic attestations and selective disclosure — so partners
          can rely on a check without you sending a full copy of your ID to every service.
        </p>
      </section>

      <section className="mt-8 space-y-3" style={{ fontFamily: sans }}>
        <h2 className="text-[18px] font-semibold text-slate-900" style={{ fontFamily: serif }}>
          Technical verification
        </h2>
        <p className="text-[14px] leading-relaxed text-slate-600">
          You can open the Eigen verification dashboard to review the application and attestation details
          associated with this deployment.
        </p>
        <button
          type="button"
          onClick={() => window.open(eigenUrl, "_blank", "noopener,noreferrer")}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#4338CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Open verification dashboard
          <ExternalLink size={16} aria-hidden />
        </button>
      </section>

      <section className="mt-8 space-y-3" style={{ fontFamily: sans }}>
        <h2 className="text-[18px] font-semibold text-slate-900" style={{ fontFamily: serif }}>
          Your choices
        </h2>
        <p className="text-[14px] leading-relaxed text-slate-600">
          You decide which attributes to include when approving a request. Revoke or re-verify from the
          vault when your situation changes.
        </p>
      </section>

      <button
        type="button"
        onClick={() => router.back()}
        className="mt-10 h-12 w-full rounded-xl border border-slate-200 bg-white text-[15px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
        style={{ fontFamily: sans }}
      >
        Back
      </button>
    </div>
  );
}
