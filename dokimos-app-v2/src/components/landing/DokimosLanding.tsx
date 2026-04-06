import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Code2,
  Fingerprint,
  LayoutDashboard,
  Lock,
  Shield,
} from "lucide-react";
import { LandingNav } from "./LandingNav";

/**
 * Marketing surface: restrained “Plaid-style” canvas — 2 neutrals + 1 accent hue,
 * only two radial blobs + one base gradient + whisper grid (premium, not noisy).
 */
export function DokimosLanding() {
  return (
    <div
      id="main-content"
      className="font-landing relative min-h-[100dvh] overflow-x-hidden text-slate-800"
    >
      {/* Base: smooth stone/zinc (full-bleed, calm) */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-[linear-gradient(180deg,#fafaf9_0%,#f4f4f5_42%,#ebebeb_100%)]"
        aria-hidden
      />
      {/* Exactly two soft blobs: teal mist above + slate depth corner — expansive, not rainbow */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(13,148,136,0.12),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_100%,rgba(100,116,139,0.09),transparent_50%)]"
        aria-hidden
      />
      {/* Whisper grid: large cells, low contrast, fades out — adds scale without clutter */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(71,85,105,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(71,85,105,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black_0%,black_65%,transparent_92%)]"
        aria-hidden
      />

      <LandingNav />

      <main className="relative z-10 mx-auto w-full max-w-[min(100%-2rem,1160px)] px-5 pb-24 pt-36 sm:px-8 md:pt-40 lg:px-10 lg:pt-44">
        {/* Hero — asymmetric grid; narrower max-width keeps columns closer on large screens */}
        <section className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:items-center lg:gap-10 xl:gap-14">
          <div>
            <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.03em] text-slate-900">
              The last time you&apos;ll ever have to upload your ID
            </h1>
            <p className="mt-6 max-w-[34rem] text-[17px] leading-[1.55] text-slate-600 sm:text-[18px]">
              Verify once in a protected environment. Approve what you share, per request. Prove
              outcomes with cryptography—not just a checkbox.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/onboarding"
                className="inline-flex h-12 min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700 px-8 text-[16px] font-semibold text-white shadow-[0_8px_32px_rgba(13,148,136,0.35),0_4px_12px_rgba(15,118,110,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] transition-[transform,box-shadow,filter] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(13,148,136,0.42),0_6px_16px_rgba(15,118,110,0.3)] active:translate-y-0"
              >
                For Individuals
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="/business"
                className="inline-flex h-12 min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-8 text-[16px] font-semibold text-slate-800 shadow-[0_8px_28px_rgba(71,85,105,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-md transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(71,85,105,0.14)]"
              >
                For Businesses
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          <HeroVisual />
        </section>

        {/* Logo strip */}
        <section className="mt-20 rounded-3xl border border-white/40 bg-white/30 py-10 shadow-[0_8px_40px_rgba(71,85,105,0.07)] backdrop-blur-md lg:mt-28">
          <p className="text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-teal-800/70">
            Built for teams who need auditability
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {["EigenCompute", "Intel TDX", "TEE attestation", "Selective disclosure"].map((name) => (
              <span
                key={name}
                className="rounded-full border border-teal-200/60 bg-white/50 px-4 py-2 text-[13px] font-semibold tracking-tight text-slate-700 shadow-[0_4px_16px_rgba(71,85,105,0.06)] backdrop-blur-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </section>

        {/* Product pillars */}
        <section id="product" className="mt-20 scroll-mt-28 lg:mt-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-bold tracking-tight text-slate-900">
              Everything you need to verify identity
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-slate-600">
              From document capture to signed proofs — one flow for users, one API for your
              backend.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <ProductCard
              icon={<Fingerprint className="h-6 w-6" />}
              title="Verify once"
              description="Government ID and liveness in a secure processing environment. Your images aren’t treated like ordinary uploads."
            />
            <ProductCard
              icon={<Shield className="h-6 w-6" />}
              title="Share on approval"
              description="Review each request before any attributes are released. Decline anything that doesn’t match your comfort."
            />
            <ProductCard
              icon={<Lock className="h-6 w-6" />}
              title="Prove with cryptography"
              description="Attestations you can verify independently — signatures, Eigen metadata, and TEE-backed execution context."
            />
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="mt-20 scroll-mt-28 rounded-3xl border border-white/50 bg-white/45 p-8 shadow-[0_12px_48px_rgba(71,85,105,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl sm:p-12 lg:mt-28"
        >
          <h2 className="text-center text-[clamp(1.5rem,2.5vw,1.875rem)] font-bold text-slate-900">
            How Dokimos works
          </h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: 1, t: "Upload ID", b: "Encrypted in transit to the verification processor." },
              { n: 2, t: "Match & verify", b: "Document checks and face match inside protected hardware." },
              { n: 3, t: "Get proof", b: "A compact credential you can use for approvals—not a gallery of IDs." },
              { n: 4, t: "Approve requests", b: "Each org asks; you choose what to share, when." },
            ].map((step) => (
              <div key={step.n} className="relative text-center lg:text-left">
                <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-[14px] font-bold text-white shadow-[0_6px_20px_rgba(13,148,136,0.4)] lg:mx-0">
                  {step.n}
                </div>
                <h3 className="text-[16px] font-semibold text-slate-900">{step.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{step.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Developer panel — Plaid dark slate contrast */}
        <section className="mt-20 lg:mt-28">
          <div className="overflow-hidden rounded-3xl border border-teal-500/25 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-6 py-10 text-white shadow-[0_16px_64px_rgba(13,148,136,0.12),0_8px_32px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-10 sm:py-14">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-teal-200/95 shadow-[0_4px_20px_rgba(13,148,136,0.12)]">
                  <Code2 className="h-3.5 w-3.5" />
                  Developers
                </div>
                <h2 className="mt-4 text-[clamp(1.5rem,2.5vw,2rem)] font-bold leading-tight">
                  Trigger verifications from your backend
                </h2>
                <p className="mt-4 text-[16px] leading-relaxed text-[#94a3b8]">
                  POST to our API with a workflow id and user email. Receive cryptographic
                  attestations your services can verify programmatically.
                </p>
                <Link
                  href="/integration"
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl text-[15px] font-semibold text-teal-300 transition-[color,transform] hover:translate-x-0.5 hover:text-teal-100"
                >
                  Explore integration guides
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-slate-200 shadow-[inset_0_2px_24px_rgba(0,0,0,0.35),0_0_0_1px_rgba(45,212,191,0.1)] sm:text-[12px]">
                <div className="mb-3 flex gap-2 border-b border-white/10 pb-3 text-[#64748b]">
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">POST</span>
                  <span>/api/request-verification</span>
                </div>
                <pre className="whitespace-pre-wrap">{`{
  "workflow": "host_verification",
  "userEmail": "user@example.com",
  "requestedAttributes": ["ageOver21", "name", "notExpired"]
}`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Verifier CTA */}
        <section className="mt-20 lg:mt-28">
          <div className="grid items-center gap-8 rounded-3xl border border-white/50 bg-white/55 p-8 shadow-[0_12px_48px_rgba(71,85,105,0.1)] backdrop-blur-xl sm:p-10 lg:grid-cols-[1fr_auto] lg:gap-12">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 via-white to-slate-100 text-teal-800 shadow-[0_8px_24px_rgba(13,148,136,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-slate-900">Verifier dashboard</h2>
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600">
                  Explore programs, monitor volume, and review verification activity in a demo
                  experience modeled after modern trust & safety tools.
                </p>
              </div>
            </div>
            <Link
              href="/business"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-teal-200/80 bg-white/90 px-8 text-[14px] font-semibold text-slate-800 shadow-[0_8px_28px_rgba(71,85,105,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(13,148,136,0.15)] lg:w-auto"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <LandingFooter />
      </main>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[600px] lg:mx-0 lg:max-w-none">
      <div className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-[0_20px_60px_rgba(71,85,105,0.12),0_8px_24px_rgba(13,148,136,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-teal-100/80 px-3 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] shadow-sm" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] shadow-sm" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] shadow-sm" />
          </div>
          <div className="ml-2 flex-1 rounded-full bg-slate-100/90 px-3 py-1.5 text-center text-[11px] text-slate-600 shadow-inner">
            app.dokimos.com
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-2xl border border-teal-100/80 bg-gradient-to-br from-white to-teal-50/40 p-4 shadow-[0_8px_24px_rgba(71,85,105,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800/85">
              Identity vault
            </p>
            <p className="mt-3 text-[22px] font-bold text-slate-900">Verified</p>
            <div className="mt-4 flex items-center gap-2 text-[12px] font-medium text-emerald-600">
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Face matched to ID
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/80 p-4 shadow-[0_8px_24px_rgba(251,191,36,0.12)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/80">
              Pending request
            </p>
            <p className="mt-2 text-[14px] font-semibold text-slate-900">Acme Corp</p>
            <p className="mt-1 text-[12px] text-slate-600">3 attributes requested</p>
            <div className="mt-4 h-9 rounded-xl bg-gradient-to-r from-slate-800 to-teal-900 text-center text-[12px] font-semibold leading-9 text-white shadow-[0_6px_20px_rgba(15,23,42,0.35)]">
              Review
            </div>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute -right-6 -top-6 hidden h-32 w-32 rounded-full bg-gradient-to-br from-teal-400/25 to-teal-600/15 blur-3xl lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 hidden h-28 w-28 rounded-full bg-gradient-to-tr from-slate-400/20 to-transparent blur-2xl lg:block"
        aria-hidden
      />
    </div>
  );
}

function ProductCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-3xl border border-white/60 bg-white/55 p-6 shadow-[0_12px_40px_rgba(71,85,105,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_56px_rgba(13,148,136,0.12)]">
      <div
        className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl text-teal-800 shadow-[0_8px_24px_rgba(13,148,136,0.2),inset_0_1px_0_rgba(255,255,255,0.65)]"
        style={{
          background: "linear-gradient(135deg, #ccfbf1 0%, #f0fdfa 45%, #e2e8f0 100%)",
        }}
      >
        {icon}
      </div>
      <h3 className="mt-5 text-[17px] font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

function LandingFooter() {
  return (
    <footer id="footer" className="mt-24 scroll-mt-28 rounded-3xl border border-white/40 bg-white/35 px-6 py-10 shadow-[0_8px_40px_rgba(71,85,105,0.05)] backdrop-blur-md sm:px-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2 text-[16px] font-bold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-slate-900 text-[13px] text-white shadow-[0_8px_24px_rgba(13,148,136,0.35)]">
              D
            </span>
            Dokimos
          </Link>
          <p className="mt-3 max-w-xs text-[14px] text-slate-600">
            Cryptographic identity infrastructure for the modern web.
          </p>
        </div>
        <div className="flex flex-wrap gap-10 text-[14px]">
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-teal-800/75">
              Product
            </p>
            <ul className="space-y-2 text-slate-800">
              <li>
                <Link href="/onboarding" className="hover:underline">
                  For Individuals
                </Link>
              </li>
              <li>
                <Link href="/app/vault" className="hover:underline">
                  Open app
                </Link>
              </li>
              <li>
                <Link href="/business" className="hover:underline">
                  For Businesses
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-teal-800/75">
              Developers
            </p>
            <ul className="space-y-2 text-slate-800">
              <li>
                <Link href="/integration" className="hover:underline">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p className="mt-10 text-center text-[12px] text-slate-500 sm:text-left">
        © {new Date().getFullYear()} Dokimos. Demo experience — not financial advice.
      </p>
    </footer>
  );
}
