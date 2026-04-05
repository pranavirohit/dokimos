"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Check,
  CheckCircle,
  XCircle,
  Shield,
  Car,
  Home,
  FileText,
  UserCheck,
  ExternalLink,
  Copy,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Timer,
  Search,
  Filter,
  Download,
  Plus,
  X,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Code,
  Info,
  ArrowUpDown,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DokimosPageTitle } from "@/components/dokimos/DokimosPageTitle";
import { VERIFIER_CARD } from "@/components/dokimos/dokimosStyles";
import { BUSINESS_DEMO_REQUESTS } from "@/components/verifier/businessDemoData";
import { VerificationProgressiveModal } from "@/components/verifier/VerificationProgressiveModal";
import {
  buildPlainLanguageVerificationRows,
  getVerificationDisplayName as displayNameForRequest,
  resolveVerificationDisplayName,
} from "@/lib/verificationPlainLanguage";

interface VerifierSession {
  verifierId: string;
  companyName: string;
  email: string;
}

interface VerificationRequest {
  requestId: string;
  verifierId: string;
  verifierName: string;
  verifierEmail: string;
  userEmail: string;
  requestedAttributes: string[];
  workflow?: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  completedAt?: string;
  attestation: any | null;
}

/** Lucide icon key for program cards */
type ProgramIconKey = "userCheck" | "car" | "shield";

/** Business-facing verification program (maps to a workflow ID for API / filtering) */
interface VerificationProgram {
  id: string;
  workflowId: string;
  name: string;
  iconKey: ProgramIconKey;
  /** e.g. "For: New driver applications" */
  audienceDescription: string;
  /** Human-readable lines for "What gets verified" */
  displayAttributes: string[];
  compliance: string;
  stats: {
    thisMonth: number;
    approvalRate: number;
    avgTime: string;
  };
  status: "active" | "inactive";
}

/** Create-workflow modal: attribute keys match TEE /verify attribute names */
const WORKFLOW_ATTRIBUTE_OPTIONS: {
  key: string;
  title: string;
  description: string;
}[] = [
  {
    key: "name",
    title: "Full Name",
    description: "Legal name from government ID",
  },
  {
    key: "dateOfBirth",
    title: "Date of Birth",
    description: "Full birthdate (ISO in attestation; derived age thresholds available)",
  },
  {
    key: "nationality",
    title: "Nationality",
    description: "Country of citizenship (full name, e.g. United States)",
  },
  {
    key: "address",
    title: "Address",
    description: "Mailing or residential address from ID or supplemental check",
  },
  {
    key: "documentType",
    title: "Document Type",
    description: "Driver's License, Passport, National ID Card",
  },
  {
    key: "documentExpiryDate",
    title: "Document Expiry Date",
    description: "When the ID expires (ISO date in proof)",
  },
  {
    key: "notExpired",
    title: "Document Not Expired",
    description: "Government ID is currently valid",
  },
  {
    key: "ageOver18",
    title: "Age Over 18",
    description: "Derived from date of birth on ID",
  },
  {
    key: "ageOver21",
    title: "Age Over 21",
    description: "Derived from date of birth on ID",
  },
];

const PROGRAM_ICON_MAP: Record<
  ProgramIconKey,
  { Icon: LucideIcon; bg: string; fg: string }
> = {
  userCheck: { Icon: UserCheck, bg: "bg-slate-100", fg: "text-slate-700" },
  car: { Icon: Car, bg: "bg-sky-50", fg: "text-sky-700" },
  shield: { Icon: Shield, bg: "bg-emerald-50", fg: "text-emerald-700" },
};

/** Workflow-specific icons (preferred over PROGRAM_ICON_MAP for scanning). */
const WORKFLOW_PROGRAM_ICONS: Record<
  string,
  { Icon: LucideIcon; bg: string; fg: string }
> = {
  host_verification: {
    Icon: Home,
    bg: "bg-green-100",
    fg: "text-green-700",
  },
  guest_verification: {
    Icon: UserCheck,
    bg: "bg-sky-100",
    fg: "text-sky-700",
  },
  experience_host: {
    Icon: Shield,
    bg: "bg-violet-100",
    fg: "text-violet-700",
  },
  driver_background_check: {
    Icon: Car,
    bg: "bg-blue-100",
    fg: "text-blue-700",
  },
  vehicle_registration: {
    Icon: FileText,
    bg: "bg-amber-100",
    fg: "text-amber-700",
  },
  continuous_monitoring: {
    Icon: Shield,
    bg: "bg-emerald-100",
    fg: "text-emerald-700",
  },
  driver_onboarding: {
    Icon: Car,
    bg: "bg-blue-100",
    fg: "text-blue-700",
  },
};

function getWorkflowProgramIcon(program: VerificationProgram): {
  Icon: LucideIcon;
  bg: string;
  fg: string;
} {
  return (
    WORKFLOW_PROGRAM_ICONS[program.workflowId] ??
    PROGRAM_ICON_MAP[program.iconKey]
  );
}

type TabType = 'overview' | 'verifications' | 'workflows';

/** Seeded TEE verifier for Airbnb — matches `src/index.ts` demo accounts (`airbnb_prod`). */
const AIRBNB_DEMO_SESSION: VerifierSession = {
  verifierId: "airbnb_prod",
  companyName: "Airbnb",
  email: "verify@airbnb.com",
};

/** Demo-only dashboard for `/business` — offline demo session and rows (no auth, no API). */
export function VerifierDashboard() {
  const session = AIRBNB_DEMO_SESSION;
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [requests] = useState<VerificationRequest[]>(
    () => BUSINESS_DEMO_REQUESTS as VerificationRequest[]
  );
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  /** When set, Verifications tab filters to this workflow ID */
  const [workflowFilter, setWorkflowFilter] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const programs: VerificationProgram[] = [
    {
      id: "host_verification",
      workflowId: "host_verification",
      name: "Host Verification",
      iconKey: "userCheck",
      audienceDescription:
        "Verify identity and eligibility for hosts listing properties",
      displayAttributes: [
        "Government-issued ID",
        "Age 18+ verification",
        "Address confirmation",
        "Full name verification",
      ],
      compliance:
        "Host identity and eligibility checks; obligations vary by region (e.g. short-term rental rules).",
      stats: { thisMonth: 1247, approvalRate: 98, avgTime: "2m 18s" },
      status: "active",
    },
    {
      id: "guest_verification",
      workflowId: "guest_verification",
      name: "Guest Identity Check",
      iconKey: "car",
      audienceDescription:
        "Verify guest identity before booking confirmation",
      displayAttributes: [
        "Government-issued ID",
        "Age 18+ verification",
        "Full name verification",
      ],
      compliance: "Booking and trust & safety policies for guest identity.",
      stats: { thisMonth: 3891, approvalRate: 99, avgTime: "1m 48s" },
      status: "active",
    },
    {
      id: "experience_host",
      workflowId: "experience_host",
      name: "Experience Host Verification",
      iconKey: "shield",
      audienceDescription:
        "Enhanced verification for hosts offering experiences",
      displayAttributes: [
        "Government-issued ID",
        "Age 21+ verification",
        "Full name verification",
        "Address confirmation",
      ],
      compliance: "Experience host and activities requirements by jurisdiction.",
      stats: { thisMonth: 456, approvalRate: 98, avgTime: "2m 6s" },
      status: "active",
    },
  ];

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const deniedRequests = requests.filter(r => r.status === 'denied');
  const totalVerifications = requests.length;
  const approvalRate = totalVerifications > 0 ? ((approvedRequests.length / totalVerifications) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex min-h-screen w-full flex-col bg-dokimos-verifier-canvas">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dokimos-core text-white ring-1 ring-gray-300">
              <Building2 className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight tracking-tight text-gray-900">
                {session.companyName}
              </h1>
              <p className="text-sm text-gray-500">{session.email}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end sm:flex-1">
            <p
              className="text-right text-[13px] font-normal leading-normal"
              style={{
                fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              }}
            >
              <span className="text-[#64748B]">Viewing as: </span>
              <span className="font-semibold text-[#0F172A]">Airbnb</span>
            </p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white/80">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex w-full min-w-0 flex-wrap gap-6 sm:gap-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'verifications', label: 'Verifications' },
              { id: 'workflows', label: 'Programs' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors duration-150 ease-out ${
                  activeTab === tab.id
                    ? 'border-dokimos-verifier-accent text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 md:py-8 lg:px-8 xl:px-12">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <OverviewTab
                requests={requests}
                programs={programs}
                setActiveTab={setActiveTab}
              />
            </motion.div>
          )}
          {activeTab === "verifications" && (
            <motion.div
              key="verifications"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <VerificationsTab
                requests={requests}
                programs={programs}
                workflowFilter={workflowFilter}
                onClearWorkflowFilter={() => setWorkflowFilter(null)}
              />
            </motion.div>
          )}
          {activeTab === "workflows" && (
            <motion.div
              key="workflows"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <WorkflowsTab
                programs={programs}
                showCreateWorkflow={showCreateWorkflow}
                setShowCreateWorkflow={setShowCreateWorkflow}
                setActiveTab={setActiveTab}
                setWorkflowFilter={setWorkflowFilter}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW
// ═══════════════════════════════════════════════════════════════════

function OverviewTab({ requests, programs, setActiveTab }: { requests: VerificationRequest[]; programs: VerificationProgram[]; setActiveTab: (tab: TabType) => void }) {
  const programName = (workflowId?: string) => {
    const id = workflowId || "host_verification";
    return programs.find((p) => p.workflowId === id)?.name ?? id;
  };

  const totalVerifications = requests.length || 1570;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const approvalRate = totalVerifications > 0 ? ((approvedCount / totalVerifications) * 100).toFixed(1) : '87.3';
  const monthlyCost = (totalVerifications * 0.50).toFixed(2);

  const recentActivity = requests.slice(0, 5);

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="w-full max-w-full space-y-8">
      <DokimosPageTitle
        title="Host verifications"
        subtitle="Monitor verification volume, program performance, and recent activity"
        titleClassName="dokimos-verifier-page-title mb-1.5 text-gray-900"
        subtitleClassName="mt-1 text-sm leading-normal text-gray-600"
      />

      {/* Stats — 1 col phone, 2 col small tablet, 4 col from ~900px (laptop) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 min-[900px]:grid-cols-4 min-[900px]:gap-6">
        <div className={`${VERIFIER_CARD} p-5 sm:p-6`}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Total verifications
          </p>
          <p className="mb-1 text-3xl font-semibold tabular-nums text-gray-900 tracking-tight">
            {totalVerifications.toLocaleString()}
          </p>
          <p className="mb-2 text-xs text-gray-500">This month</p>
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <TrendingUp size={14} />
            <span>12% vs last month</span>
          </div>
        </div>

        <div className={`${VERIFIER_CARD} p-5 sm:p-6`}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Approval rate
          </p>
          <p className="mb-1 text-3xl font-semibold tabular-nums text-gray-900 tracking-tight">
            {approvalRate}%
          </p>
          <p className="mb-2 text-xs text-gray-500">Last 30 days</p>
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <TrendingUp size={14} />
            <span>2.1% vs previous period</span>
          </div>
        </div>

        <div className={`${VERIFIER_CARD} p-5 sm:p-6`}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Avg completion time
          </p>
          <p className="mb-1 text-3xl font-semibold tabular-nums text-gray-900 tracking-tight">
            3m 12s
          </p>
          <p className="mb-2 text-xs text-gray-500">Median time to complete</p>
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <TrendingDown size={14} />
            <span>15s faster than last month</span>
          </div>
        </div>

        <div className={`${VERIFIER_CARD} p-5 sm:p-6`}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Monthly cost
          </p>
          <p className="mb-1 text-3xl font-semibold tabular-nums text-gray-900 tracking-tight">
            ${monthlyCost}
          </p>
          <p className="mb-2 text-xs text-gray-500">{totalVerifications} verifications × $0.50</p>
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <TrendingUp size={14} />
            <span>$47.20 vs last month</span>
          </div>
        </div>
      </div>

      {/* Program breakdown */}
      <div className={`${VERIFIER_CARD} p-6`}>
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-gray-900">
          Verifications by program
        </h2>
        <div className="space-y-4">
          {(() => {
            const totalMonthly = programs.reduce((s, p) => s + p.stats.thisMonth, 0) || 1;
            return programs.map((program) => {
              const percentage = ((program.stats.thisMonth / totalMonthly) * 100).toFixed(0);
              return (
                <div key={program.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600">{program.name}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {program.stats.thisMonth.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-dokimos-core transition-all duration-300 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* How It Works - Eigen Integration Explainer */}
      <div className="rounded-lg border border-gray-300 bg-gradient-to-br from-slate-50 to-white p-6 shadow-none ring-1 ring-gray-200">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 tracking-tight">
          How Dokimos + EigenCompute works
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dokimos-core text-xs font-semibold text-white shadow-none">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900">User uploads ID in TEE</p>
              <p className="text-gray-500 text-xs mt-0.5">Document processed in Intel TDX secure enclave</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dokimos-core text-xs font-semibold text-white shadow-none">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900">TEE generates attestation</p>
              <p className="text-gray-500 text-xs mt-0.5">Cryptographic proof of code execution (MRENCLAVE)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dokimos-core text-xs font-semibold text-white shadow-none">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900">Eigen AVS verifies attestation</p>
              <p className="text-gray-500 text-xs mt-0.5">Economic security via operator staking</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dokimos-core text-xs font-semibold text-white shadow-none">
              4
            </div>
            <div>
              <p className="font-medium text-gray-900">You verify independently</p>
              <p className="text-gray-500 text-xs mt-0.5">Check signature on Etherscan, deployment on EigenCloud</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`${VERIFIER_CARD} p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-900">
            Recent activity
          </h2>
          <button 
            onClick={() => setActiveTab('verifications')}
            className="text-sm font-medium text-dokimos-verifier-accent hover:text-dokimos-verifier-accent-hover transition-colors duration-150"
          >
            View all verifications →
          </button>
        </div>
        
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map(req => (
              <div
                key={req.requestId}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${
                        req.status === "approved"
                          ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-800"
                          : req.status === "pending"
                            ? "border-amber-500/25 bg-amber-500/15 text-amber-800"
                            : "border-red-500/25 bg-red-500/15 text-red-700"
                      }`}
                    >
                      {req.status === "approved"
                        ? "Approved"
                        : req.status === "pending"
                          ? "Pending"
                          : "Denied"}
                    </span>
                    <span className="min-w-0 truncate text-sm font-medium text-gray-900">
                      {displayNameForRequest(req)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{getRelativeTime(req.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {programName(req.workflow)} · {req.requestedAttributes.length}{" "}
                  attributes
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VERIFY THIS CHECK — WIZARD MODAL
// ═══════════════════════════════════════════════════════════════════

interface VerifyAttestationApiResponse {
  ok?: boolean;
  signatureValid: boolean;
  teeFieldsPresent: boolean;
  eigenMetadataPresent: boolean;
  eigenAppIdMatchesExpected: boolean;
  note?: string;
  expectedEigenAppId?: string;
  error?: string;
}

const DEFAULT_GIT_SHA =
  process.env.NEXT_PUBLIC_DOKIMOS_GIT_SHA ??
  "1f722ca8084ebeae917ce0ef5b3012ce86296496";
const DEFAULT_IMAGE_DIGEST =
  process.env.NEXT_PUBLIC_DOKIMOS_IMAGE_DIGEST ??
  "sha256:c3a3c11c046da144679625d824bb765c9b6fd358dec631324dce6b17fe4d504c";

function truncateHash(s: string, len = 20): string {
  if (!s || s.length <= len + 3) return s;
  return `${s.slice(0, len)}...`;
}

function truncateMid(s: string, max = 40): string {
  if (!s || s.length <= max) return s;
  const half = Math.floor(max / 2) - 1;
  return `${s.slice(0, half)}...${s.slice(-half)}`;
}

const VERIFY_MODAL_SANS =
  "var(--font-instrument-sans), system-ui, sans-serif" as const;
const VERIFY_MODAL_SERIF =
  "var(--font-instrument-serif), Georgia, serif" as const;

type VerifyLayer = "summary" | "explainer" | "technical";

function downloadAttestationJson(att: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(att, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function displayNameFromAttestation(
  att: Record<string, unknown>,
  fallbackEmail: string
): string {
  const attrs = att.attributes as Record<string, unknown> | undefined;
  const n = attrs?.name;
  return resolveVerificationDisplayName(
    typeof n === "string" ? n : undefined,
    fallbackEmail
  );
}

function fallbackVerificationRows(req: VerificationRequest): {
  label: string;
  value: string;
}[] {
  const map: Record<string, string> = {
    ageOver18: "Age",
    ageOver21: "Age",
    name: "Full Name",
    dateOfBirth: "Date of Birth",
    nationality: "Nationality",
    notExpired: "ID Document",
    documentType: "Document Type",
    documentExpiryDate: "Document Expiry",
  };
  return (req.requestedAttributes ?? []).map((k) => ({
    label: map[k] || k,
    value: "Included in signed proof",
  }));
}

function VerifyCheckModal({
  open,
  onClose,
  req,
}: {
  open: boolean;
  onClose: () => void;
  req: VerificationRequest | null;
}) {
  const [layer, setLayer] = useState<VerifyLayer>("summary");
  const [verificationResult, setVerificationResult] =
    useState<VerifyAttestationApiResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showSignatureDetails, setShowSignatureDetails] = useState(false);
  const [openProofSections, setOpenProofSections] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    if (!open || !req?.attestation) {
      setVerificationResult(null);
      setVerifyError(null);
      setVerifying(false);
      return;
    }
    setLayer("summary");
    setShowSignatureDetails(false);
    setOpenProofSections({});
    let cancelled = false;
    const run = async () => {
      setVerifying(true);
      setVerifyError(null);
      setVerificationResult(null);
      try {
        const response = await fetch("/api/verify-attestation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.attestation),
        });
        const data = (await response.json()) as VerifyAttestationApiResponse;
        if (!response.ok) {
          throw new Error(data.error || "Verification request failed");
        }
        if (!cancelled) setVerificationResult(data);
      } catch (e) {
        console.error("Verification failed:", e);
        if (!cancelled)
          setVerifyError(e instanceof Error ? e.message : "Verification failed");
      } finally {
        if (!cancelled) setVerifying(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [open, req?.requestId, req?.attestation]);

  if (!open || !req?.attestation) return null;

  const att = req.attestation as Record<string, unknown>;
  const primaryBtn =
    "inline-flex items-center gap-2 rounded-lg bg-dokimos-core px-5 py-2.5 text-sm font-medium text-white shadow-none transition-colors duration-150 ease-out hover:bg-neutral-800 active:scale-[0.98]";
  const secondaryBtn =
    "rounded-lg bg-gray-50 px-5 py-2.5 text-sm font-medium text-gray-900 transition-colors duration-150 ease-out hover:bg-gray-100";
  const outlineBtn =
    "px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors duration-150 inline-flex items-center gap-2";
  const ghostNavBtn =
    "rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900";

  const teeOk =
    Boolean(verificationResult?.teeFieldsPresent) &&
    Boolean(verificationResult?.eigenMetadataPresent);
  const sigOk = Boolean(verificationResult?.signatureValid);
  const eigenAppOk = Boolean(verificationResult?.eigenAppIdMatchesExpected);
  const bio = att.biometricVerification as
    | { faceMatch?: boolean; confidence?: number }
    | undefined;
  const faceStepOk =
    bio == null
      ? null
      : Boolean(bio.faceMatch === true);

  const plainRows = buildPlainLanguageVerificationRows(att, req.userEmail);
  const personName = displayNameFromAttestation(att, req.userEmail);
  const verifiedTs =
    typeof att.timestamp === "string"
      ? att.timestamp
      : req.completedAt || req.createdAt;
  const verifiedAtLabel = new Date(verifiedTs).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const firstName = personName.split(/\s+/)[0] ?? personName;
  const tee = att.tee as {
    mrenclave?: string;
    tcbStatus?: string;
    quote?: string;
  } | undefined;
  const eigen = att.eigen as {
    verificationUrl?: string;
    appId?: string;
  } | undefined;

  const summaryPositive =
    !verifying &&
    !verifyError &&
    verificationResult &&
    sigOk;

  const headerTitle =
    layer === "summary"
      ? "Verification"
      : layer === "explainer"
        ? "How Dokimos works"
        : "Verify it yourself";

  const TECH_STEPS = 5;

  const toggleProof = (idx: number) => {
    setOpenProofSections((p) => ({ ...p, [idx]: !p[idx] }));
  };

  const technicalAllPassed =
    Boolean(verificationResult) &&
    sigOk &&
    teeOk &&
    eigenAppOk &&
    (faceStepOk === null || faceStepOk === true);

  const stepProgress = (n: number) => (
    <div className="mb-3">
      <p className="text-xs font-medium text-gray-500">
        Step {n} of {TECH_STEPS}
      </p>
      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${(n / TECH_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-none transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {layer !== "summary" && (
              <button
                type="button"
                onClick={() => setLayer("summary")}
                className={ghostNavBtn}
                style={{ fontFamily: VERIFY_MODAL_SANS }}
              >
                ← Back
              </button>
            )}
            <ShieldCheck className="h-6 w-6 shrink-0 text-dokimos-verifier-accent" />
            <h2
              className="truncate text-lg font-semibold text-gray-900 tracking-tight"
              style={{ fontFamily: VERIFY_MODAL_SERIF }}
            >
              {headerTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6 transition-opacity duration-300">
          {layer === "summary" && (
            <div className="space-y-6">
              {verifying && (
                <div
                  className="flex flex-col items-center justify-center gap-3 py-10 text-center"
                  style={{ fontFamily: VERIFY_MODAL_SANS }}
                >
                  <span className="inline-flex gap-1 text-gray-400" aria-hidden>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-dokimos-verifier-accent" />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-dokimos-verifier-accent"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-dokimos-verifier-accent"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                  <p className="text-sm text-gray-600">
                    Checking this proof…
                  </p>
                </div>
              )}

              {!verifying && verifyError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
                    <div style={{ fontFamily: VERIFY_MODAL_SANS }}>
                      <p className="font-semibold text-red-900">
                        Couldn&apos;t verify automatically
                      </p>
                      <p className="mt-1 text-sm text-red-800">{verifyError}</p>
                    </div>
                  </div>
                </div>
              )}

              {!verifying &&
                verificationResult &&
                !verifyError &&
                !sigOk && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                    <div className="flex items-start gap-3">
                      <XCircle className="mt-0.5 h-8 w-8 shrink-0 text-amber-600" />
                      <div style={{ fontFamily: VERIFY_MODAL_SANS }}>
                        <h3
                          className="text-lg font-semibold text-amber-950"
                          style={{ fontFamily: VERIFY_MODAL_SERIF }}
                        >
                          Verification not confirmed
                        </h3>
                        <p className="mt-2 text-sm text-amber-900">
                          The digital seal on this proof doesn&apos;t check out.
                          Don&apos;t rely on this result until your team
                          investigates.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {!verifying && summaryPositive && (
                <>
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle
                        className="h-9 w-9 text-emerald-600"
                        strokeWidth={2}
                      />
                    </div>
                    <h3
                      className="text-2xl font-semibold text-gray-900"
                      style={{ fontFamily: VERIFY_MODAL_SERIF }}
                    >
                      Verification confirmed
                    </h3>
                    <p
                      className="mt-3 max-w-md text-[15px] leading-relaxed text-gray-600"
                      style={{ fontFamily: VERIFY_MODAL_SANS }}
                    >
                      {personName}&apos;s identity has been verified by secure
                      hardware. No manual review needed.
                    </p>
                    <p
                      className="mt-4 text-sm text-gray-500"
                      style={{ fontFamily: VERIFY_MODAL_SANS }}
                    >
                      Verified: {verifiedAtLabel}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-300 bg-gray-50/80 p-5">
                    <p
                      className="mb-3 text-sm font-semibold text-gray-900"
                      style={{ fontFamily: VERIFY_MODAL_SANS }}
                    >
                      What was verified
                    </p>
                    <ul className="space-y-2.5">
                      {(plainRows.length
                        ? plainRows
                        : fallbackVerificationRows(req)
                      ).map((row) => (
                        <li
                          key={`${row.label}-${row.value}`}
                          className="flex gap-2 text-left text-sm text-gray-700"
                          style={{ fontFamily: VERIFY_MODAL_SANS }}
                        >
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                            strokeWidth={2.5}
                          />
                          <span>
                            <span className="font-medium text-gray-900">
                              {row.label}:
                            </span>{" "}
                            {row.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
                    style={{ fontFamily: VERIFY_MODAL_SANS }}
                  >
                    <button
                      type="button"
                      onClick={() => setLayer("explainer")}
                      className={secondaryBtn}
                    >
                      How does this work?
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayer("technical")}
                      className={primaryBtn}
                    >
                      Technical details
                    </button>
                  </div>
                </>
              )}

              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={secondaryBtn}
                  style={{ fontFamily: VERIFY_MODAL_SANS }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {layer === "explainer" && (
            <div
              className="space-y-6"
              style={{ fontFamily: VERIFY_MODAL_SANS }}
            >
              <p className="text-[15px] leading-relaxed text-gray-600">
                Think of Dokimos like a notary, but digital and extremely hard
                to fake.
              </p>
              <p className="text-sm font-medium text-gray-900">
                Here&apos;s what happened:
              </p>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="text-xl leading-none" aria-hidden>
                    1️⃣
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {firstName} uploaded an ID once
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      It was sent to secure, isolated hardware—not stored on an
                      ordinary app server.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-xl leading-none" aria-hidden>
                    2️⃣
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      The hardware checked the basics
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                      <li>Is the ID real and not expired?</li>
                      <li>Does the live face match the ID photo?</li>
                      <li>Is the person old enough?</li>
                    </ul>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-xl leading-none" aria-hidden>
                    3️⃣
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      The hardware created a digital proof
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Like a tamper-proof seal: you can check later that nothing
                      was changed after the fact.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-xl leading-none" aria-hidden>
                    4️⃣
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      You received that proof
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      You can confirm it&apos;s real without taking Dokimos&apos;
                      word for it.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-semibold text-emerald-950">
                  Why this matters
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-emerald-900/90">
                  <li>• Less manual review for routine decisions</li>
                  <li>• Harder to fake than a screenshot or PDF</li>
                  <li>• The user doesn&apos;t re-upload their ID for every partner</li>
                  <li>• Clear record of what was checked</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setLayer("summary")}
                  className={secondaryBtn}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setLayer("technical")}
                  className={primaryBtn}
                >
                  Verify it yourself →
                </button>
              </div>
            </div>
          )}

          {layer === "technical" && (
            <div
              className="space-y-6"
              style={{ fontFamily: VERIFY_MODAL_SANS }}
            >
              <p className="text-sm leading-relaxed text-gray-600">
                Follow these steps to check this proof yourself. Most teams only
                need the first two; the rest help compliance or engineering go
                deeper.
              </p>

              {verifying && (
                <div className="flex flex-col items-center gap-3 py-10 text-sm text-gray-500">
                  <span className="inline-flex gap-0.5" aria-hidden>
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: "120ms" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "240ms" }}>.</span>
                  </span>
                  Running checks…
                </div>
              )}

              {!verifying && verifyError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {verifyError}
                </div>
              )}

              {!verifying && verificationResult && (
              <>
              {/* Step 1 — Signature */}
              <section className="rounded-lg border border-gray-300 bg-white p-4 shadow-none">
                {stepProgress(1)}
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="text-base font-semibold text-gray-900"
                    style={{ fontFamily: VERIFY_MODAL_SERIF }}
                  >
                    Check the digital signature
                  </h3>
                  {!verifying && verificationResult && sigOk && (
                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                  )}
                  {!verifying && verificationResult && !sigOk && (
                    <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {!verifying && verificationResult && sigOk
                    ? "Signature checks out — this proof has not been altered since it was issued."
                    : !verifying && verificationResult && !sigOk
                      ? "We could not confirm the digital seal on this proof."
                      : null}
                </p>
                <button
                  type="button"
                  onClick={() => toggleProof(0)}
                  className="mt-3 flex items-center gap-1 text-sm font-medium text-dokimos-verifier-accent hover:text-dokimos-verifier-accent-hover"
                >
                  {openProofSections[0] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  What this proves
                </button>
                {openProofSections[0] && (
                  <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    Like a wax seal on an important letter: if the seal is
                    intact, you know nobody swapped the pages after it was
                    signed.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowSignatureDetails((v) => !v)}
                  className="mt-3 text-sm font-medium text-gray-700 underline decoration-gray-300 underline-offset-2 hover:text-gray-900"
                >
                  {showSignatureDetails ? "Hide" : "Show"} signature details
                </button>
                {showSignatureDetails && (
                  <div className="mt-2 space-y-2 font-mono text-xs text-gray-600">
                    <div className="rounded bg-gray-50 p-2 break-all">
                      signature: {truncateMid(String(att.signature ?? ""), 40)}
                    </div>
                    <div className="rounded bg-gray-50 p-2 break-all">
                      signer: {String(att.signer)}
                    </div>
                    <div className="rounded bg-gray-50 p-2 break-all">
                      messageHash: {truncateMid(String(att.messageHash ?? ""), 40)}
                    </div>
                  </div>
                )}
                <a
                  href={`https://sepolia.etherscan.io/address/${String(att.signer)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${outlineBtn} mt-3`}
                >
                  Open wallet on Etherscan
                  <ExternalLink size={14} />
                </a>
              </section>

              {/* Step 2 — Hardware */}
              <section className="rounded-lg border border-gray-300 bg-white p-4 shadow-none">
                {stepProgress(2)}
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="text-base font-semibold text-gray-900"
                    style={{ fontFamily: VERIFY_MODAL_SERIF }}
                  >
                    Verify the hardware
                  </h3>
                  {!verifying && verificationResult && teeOk && (
                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                  )}
                  {!verifying && verificationResult && !teeOk && (
                    <Shield className="h-5 w-5 shrink-0 text-amber-500" />
                  )}
                </div>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    Ran on Intel TDX secure hardware (isolated environment)
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    Production-style health signal: {String(tee?.tcbStatus ?? "—")}
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => toggleProof(1)}
                  className="mt-3 flex items-center gap-1 text-sm font-medium text-dokimos-verifier-accent hover:text-dokimos-verifier-accent-hover"
                >
                  {openProofSections[1] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  What this proves
                </button>
                {openProofSections[1] && (
                  <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    The sensitive checks did not run on a generic cloud server
                    that could be tweaked quietly—they ran in hardware designed
                    to resist that kind of change.
                  </p>
                )}
                {verificationResult?.note && (
                  <p className="mt-3 text-xs leading-relaxed text-amber-900/90">
                    Note: {verificationResult.note}
                  </p>
                )}
                {eigen?.verificationUrl && (
                  <a
                    href={eigen.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${primaryBtn} mt-3 w-fit`}
                  >
                    View on EigenCloud dashboard
                    <ExternalLink size={14} />
                  </a>
                )}
                {tee && (
                  <div className="mt-3 space-y-1 font-mono text-[11px] text-gray-500">
                    <div className="break-all">
                      Build fingerprint: {truncateHash(String(tee.mrenclave ?? ""), 24)}
                    </div>
                  </div>
                )}
              </section>

              {/* Step 3 — Source */}
              <section className="rounded-lg border border-gray-300 bg-white p-4 shadow-none">
                {stepProgress(3)}
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="text-base font-semibold text-gray-900"
                    style={{ fontFamily: VERIFY_MODAL_SERIF }}
                  >
                    Check the source code
                  </h3>
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  The verification logic lives in a public repository—you can see
                  what runs, line by line.
                </p>
                <button
                  type="button"
                  onClick={() => toggleProof(2)}
                  className="mt-3 flex items-center gap-1 text-sm font-medium text-dokimos-verifier-accent hover:text-dokimos-verifier-accent-hover"
                >
                  {openProofSections[2] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  What this proves
                </button>
                {openProofSections[2] && (
                  <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    You are not asked to trust a hidden rules engine. If the
                    code is public, teams can review what was allowed to happen
                    to an ID or a selfie.
                  </p>
                )}
                <a
                  href={`https://github.com/pranavirohit/dokimos/tree/${DEFAULT_GIT_SHA}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${primaryBtn} mt-3 w-fit`}
                >
                  View on GitHub
                  <ExternalLink size={14} />
                </a>
              </section>

              {/* Step 4 — Build */}
              <section className="rounded-lg border border-gray-300 bg-white p-4 shadow-none">
                {stepProgress(4)}
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="text-base font-semibold text-gray-900"
                    style={{ fontFamily: VERIFY_MODAL_SERIF }}
                  >
                    Verify the build
                  </h3>
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  These fingerprints tie a public commit and image to what we
                  ship—use them in a security review pack.
                </p>
                <ul className="mt-2 space-y-1 font-mono text-xs text-gray-600">
                  <li className="break-all">Commit: {DEFAULT_GIT_SHA}</li>
                  <li className="break-all">
                    Image: {truncateHash(DEFAULT_IMAGE_DIGEST, 28)}
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => toggleProof(3)}
                  className="mt-3 flex items-center gap-1 text-sm font-medium text-dokimos-verifier-accent hover:text-dokimos-verifier-accent-hover"
                >
                  {openProofSections[3] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  What this proves
                </button>
                {openProofSections[3] && (
                  <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    In a mature deployment, you can confirm the code you read on
                    GitHub is the same artifact that was deployed—no surprise
                    edits after review.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${DEFAULT_GIT_SHA}\n${DEFAULT_IMAGE_DIGEST}`
                    )
                  }
                  className={`${outlineBtn} mt-3`}
                >
                  Copy commit + image hash
                  <Copy size={14} />
                </button>
              </section>

              {/* Step 5 — Face */}
              <section className="rounded-lg border border-gray-300 bg-white p-4 shadow-none">
                {stepProgress(5)}
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="text-base font-semibold text-gray-900"
                    style={{ fontFamily: VERIFY_MODAL_SERIF }}
                  >
                    Confirm face match
                  </h3>
                  {bio != null && (
                    <>
                      {bio.faceMatch ? (
                        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 shrink-0 text-amber-500" />
                      )}
                    </>
                  )}
                </div>
                {bio == null && (
                  <p className="mt-2 text-sm text-gray-600">
                    This proof does not include a live photo check. If your
                    policy requires it, request a flow that captures a selfie.
                  </p>
                )}
                {bio != null && (
                  <p className="mt-2 text-sm text-gray-700">
                    {bio.faceMatch
                      ? `Face matched the ID photo (${typeof bio.confidence === "number" ? `${Math.round(bio.confidence * 100)}%` : "high"} confidence).`
                      : "Face match did not meet the threshold for this check."}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => toggleProof(4)}
                  className="mt-3 flex items-center gap-1 text-sm font-medium text-dokimos-verifier-accent hover:text-dokimos-verifier-accent-hover"
                >
                  {openProofSections[4] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  What this proves
                </button>
                {openProofSections[4] && (
                  <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    The person completing verification is the same person shown
                    on the government ID—not a photo of a photo from another
                    device.
                  </p>
                )}
              </section>

                <div
                  className={`flex flex-col gap-2 rounded-xl border p-4 ${
                    technicalAllPassed
                      ? "border-emerald-200 bg-emerald-50/80"
                      : "border-amber-200 bg-amber-50/80"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    {technicalAllPassed ? (
                      <>
                        <Check className="h-5 w-5 text-emerald-600" />
                        All automated checks passed
                      </>
                    ) : (
                      <>
                        <Info className="h-5 w-5 text-amber-600" />
                        Some checks need human review
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    {technicalAllPassed
                      ? "You can rely on this result for routine decisions. For regulated environments, attach this proof to your audit trail."
                      : "Review the amber items above before you treat this as fully verified."}
                  </p>
                </div>

              <p className="text-sm text-gray-600">
                You don&apos;t have to trust Dokimos blindly—each layer above is
                designed so your team can re-check the story with public tools
                and standard cryptography.
              </p>
              </>
              )}

              <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setLayer("summary")}
                  className={secondaryBtn}
                >
                  ← Back to summary
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadAttestationJson(
                      att,
                      `dokimos-proof-${req.requestId}.json`
                    )
                  }
                  className={`${primaryBtn} gap-2`}
                >
                  <Download size={16} />
                  Download proof
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2: VERIFICATIONS
// ═══════════════════════════════════════════════════════════════════

const PENDING_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;

type RowStatus = "verified" | "pending" | "denied" | "expired";

function rowStatus(req: VerificationRequest): RowStatus {
  if (req.status === "denied") return "denied";
  if (req.status === "approved") return "verified";
  if (req.status === "pending") {
    if (Date.now() - new Date(req.createdAt).getTime() > PENDING_EXPIRE_MS)
      return "expired";
    return "pending";
  }
  return "pending";
}

function VerificationsTab({
  requests,
  programs,
  workflowFilter,
  onClearWorkflowFilter,
}: {
  requests: VerificationRequest[];
  programs: VerificationProgram[];
  workflowFilter: string | null;
  onClearWorkflowFilter: () => void;
}) {
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);
  const [progressiveRequest, setProgressiveRequest] =
    useState<VerificationRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RowStatus>("all");
  const [dateRange, setDateRange] = useState<"all" | "week" | "month">("all");
  const [sortKey, setSortKey] = useState<
    "name" | "workflow" | "status" | "verified"
  >("verified");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const formatWorkflowName = (workflowId: string) => {
    const fromPrograms = programs.find((p) => p.workflowId === workflowId);
    if (fromPrograms) return fromPrograms.name;
    const map: Record<string, string> = {
      host_verification: "Host Verification",
      guest_verification: "Guest Identity Check",
      experience_host: "Experience Host Verification",
      driver_background_check: "Driver Background Check",
      vehicle_registration: "Vehicle Registration",
      continuous_monitoring: "Continuous Driver Monitoring",
      driver_onboarding: "Driver Onboarding",
      rental_application: "Rental Application",
      account_opening: "Account Opening",
      rider_verification_high_risk: "Rider Verification - High Risk",
      restaurant_partner_onboarding: "Restaurant Partner Onboarding",
    };
    if (map[workflowId]) return map[workflowId];
    if (!workflowId.trim()) return "";
    return workflowId
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const filteredProgramName =
    workflowFilter &&
    programs.find((p) => p.workflowId === workflowFilter)?.name;

  const baseFiltered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = Date.now();
    const weekMs = 7 * 86400000;
    const monthMs = 30 * 86400000;
    return requests.filter((req) => {
      if (workflowFilter && req.workflow !== workflowFilter) return false;
      const name = displayNameForRequest(req).toLowerCase();
      const email = req.userEmail.toLowerCase();
      if (q && !name.includes(q) && !email.includes(q)) return false;
      if (statusFilter !== "all" && rowStatus(req) !== statusFilter)
        return false;
      const t = new Date(req.completedAt || req.createdAt).getTime();
      if (dateRange === "week" && now - t > weekMs) return false;
      if (dateRange === "month" && now - t > monthMs) return false;
      return true;
    });
  }, [requests, workflowFilter, searchQuery, statusFilter, dateRange]);

  const sortedRows = useMemo(() => {
    const list = [...baseFiltered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = displayNameForRequest(a).localeCompare(displayNameForRequest(b));
      } else if (sortKey === "workflow") {
        cmp = formatWorkflowName(a.workflow || "").localeCompare(
          formatWorkflowName(b.workflow || "")
        );
      } else if (sortKey === "status") {
        cmp = rowStatus(a).localeCompare(rowStatus(b));
      } else {
        const ta = new Date(a.completedAt || a.createdAt).getTime();
        const tb = new Date(b.completedAt || b.createdAt).getTime();
        cmp = ta - tb;
      }
      return cmp * dir;
    });
    return list;
  }, [baseFiltered, sortKey, sortDir, programs]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);
  const pageRows = useMemo(() => {
    const p = Math.min(Math.max(1, page), totalPages);
    const start = (p - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize, totalPages]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "verified" ? "desc" : "asc");
    }
    setPage(1);
  };

  const exportCsv = () => {
    const headers = [
      "Name",
      "Email",
      "Workflow",
      "Status",
      "DateVerifiedOrRequested",
      "RequestId",
    ];
    const lines = sortedRows.map((req) => {
      const rs = rowStatus(req);
      return [
        displayNameForRequest(req),
        req.userEmail,
        formatWorkflowName(req.workflow || ""),
        rs,
        req.completedAt || req.createdAt,
        req.requestId,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",");
    });
    const blob = new Blob(["\ufeff", headers.join(",") + "\n" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dokimos-verifications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (rs: RowStatus) => {
    const styles: Record<RowStatus, string> = {
      verified: "bg-emerald-500/15 text-emerald-900 ring-emerald-500/25",
      pending: "bg-amber-500/15 text-amber-900 ring-amber-500/25",
      denied: "bg-red-500/15 text-red-900 ring-red-500/25",
      expired: "bg-gray-200/80 text-gray-700 ring-gray-300",
    };
    const label =
      rs === "verified"
        ? "Verified"
        : rs === "pending"
          ? "Pending"
          : rs === "denied"
            ? "Denied"
            : "Expired";
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${styles[rs]}`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="w-full max-w-full space-y-8">
      <DokimosPageTitle
        title="Host Verifications"
        subtitle="Review and manage requests from your users"
        titleClassName="dokimos-verifier-page-title mb-1.5 text-gray-900"
        subtitleClassName="mt-1 text-sm text-gray-600"
      />

      {workflowFilter && filteredProgramName && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-dokimos-verifier-code/90 px-4 py-3 text-sm text-gray-600">
          <span>
            Showing verifications for:{" "}
            <span className="font-semibold text-gray-900">{filteredProgramName}</span>
          </span>
          <button
            type="button"
            onClick={onClearWorkflowFilter}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            Show all programs
          </button>
        </div>
      )}

      {/* Toolbar + table */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-dokimos-verifier-accent focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "all" | RowStatus);
            setPage(1);
          }}
          className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-dokimos-verifier-accent"
        >
          <option value="all">All statuses</option>
          <option value="verified">Verified only</option>
          <option value="pending">Pending only</option>
          <option value="denied">Denied</option>
          <option value="expired">Expired</option>
        </select>
        <select
          value={dateRange}
          onChange={(e) => {
            setDateRange(e.target.value as "all" | "week" | "month");
            setPage(1);
          }}
          className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-dokimos-verifier-accent"
        >
          <option value="all">All dates</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-none">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-300 bg-dokimos-verifier-code">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900"
                  >
                    Name
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 lg:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("workflow")}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900"
                  >
                    Workflow
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900"
                  >
                    Status
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("verified")}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900"
                  >
                    Date verified
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pageRows.map((req) => {
                const rs = rowStatus(req);
                const when = req.completedAt || req.createdAt;
                return (
                  <tr
                    key={req.requestId}
                    className="cursor-pointer transition-colors hover:bg-dokimos-verifier-canvas"
                    onClick={() => setProgressiveRequest(req)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {displayNameForRequest(req)}
                    </td>
                    <td className="hidden max-w-[220px] truncate px-4 py-3 text-gray-600 lg:table-cell">
                      {req.userEmail}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatWorkflowName(req.workflow ?? "")}
                    </td>
                    <td className="px-4 py-3">{statusBadge(rs)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {new Date(when).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProgressiveRequest(req);
                        }}
                        className="text-sm font-medium text-dokimos-verifier-accent hover:text-dokimos-verifier-accent-hover"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-600">
          <span>
            Showing {(safePage - 1) * pageSize + 1}-
            {Math.min(safePage * pageSize, sortedRows.length)} of{" "}
            {sortedRows.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-200 bg-white p-2 disabled:opacity-40"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <span className="tabular-nums">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-gray-200 bg-white p-2 disabled:opacity-40"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <VerifyCheckModal
        open={verifyModalOpen}
        onClose={() => {
          setVerifyModalOpen(false);
          setSelectedRequest(null);
        }}
        req={selectedRequest}
      />

      {progressiveRequest && (
        <VerificationProgressiveModal
          request={progressiveRequest}
          onClose={() => setProgressiveRequest(null)}
        />
      )}

      {sortedRows.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center shadow-none">
          <Shield className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="text-gray-500 text-sm">No verifications found</p>
          <p className="text-gray-500 text-xs mt-1">Verifications will appear here when triggered by your application</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3: VERIFICATION PROGRAMS
// ═══════════════════════════════════════════════════════════════════

function WorkflowsTab({
  programs,
  showCreateWorkflow,
  setShowCreateWorkflow,
  setActiveTab,
  setWorkflowFilter,
}: {
  programs: VerificationProgram[];
  showCreateWorkflow: boolean;
  setShowCreateWorkflow: (show: boolean) => void;
  setActiveTab: (tab: TabType) => void;
  setWorkflowFilter: (id: string | null) => void;
}) {
  const [integrationOpenId, setIntegrationOpenId] = useState<string | null>(
    null
  );
  const [editingProgram, setEditingProgram] =
    useState<VerificationProgram | null>(null);

  const toggleIntegration = (id: string) => {
    setIntegrationOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full max-w-full space-y-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DokimosPageTitle
          title="Verification Programs"
          subtitle="Create custom verification programs for different use cases. Each program defines what identity attributes you need to verify."
          useSerifTitle={false}
          titleClassName="mb-1.5 text-2xl font-semibold text-slate-900"
          subtitleClassName="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600"
        />
        <button
          type="button"
          onClick={() => {
            setEditingProgram(null);
            setShowCreateWorkflow(true);
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-dokimos-core px-5 py-2.5 text-sm font-semibold text-white shadow-none transition-colors hover:bg-neutral-800"
        >
          <Plus size={16} />
          Create workflow
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {programs.map((program) => {
          const { Icon: ProgramIcon, bg: iconBg, fg: iconFg } =
            getWorkflowProgramIcon(program);
          return (
          <div
            key={program.id}
            className={`${VERIFIER_CARD} p-6 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50/80`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                  aria-hidden
                >
                  <ProgramIcon className={`h-6 w-6 ${iconFg}`} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {program.name}
                    </h2>
                    {program.status === "active" && (
                      <span className="rounded px-2 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/20">
                        Active
                      </span>
                    )}
                    {program.status === "inactive" && (
                      <span className="rounded px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    {program.audienceDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-4 sm:gap-5">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums text-slate-900">
                  {program.stats.thisMonth.toLocaleString()}
                </span>
                <span className="text-sm text-slate-600">this month</span>
              </div>
              <div className="hidden h-8 w-px shrink-0 bg-slate-200 sm:block" />
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums text-emerald-600">
                  {program.stats.approvalRate}%
                </span>
                <span className="text-sm text-slate-600">approved</span>
              </div>
              <div className="hidden h-8 w-px shrink-0 bg-slate-200 sm:block" />
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums text-slate-900">
                  {program.stats.avgTime}
                </span>
                <span className="text-sm text-slate-600">avg time</span>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-700">
                What Gets Verified
              </h4>
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {program.displayAttributes.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-slate-600"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check
                        className="h-3 w-3 text-emerald-600"
                        strokeWidth={3}
                      />
                    </div>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-r border-l-4 border-green-600 bg-green-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-700"
                  strokeWidth={2}
                />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-green-900">
                    Compliance
                  </div>
                  <p className="mt-1 text-sm text-green-800">{program.compliance}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-stretch gap-3 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => {
                  setWorkflowFilter(program.workflowId);
                  setActiveTab("verifications");
                }}
                className="min-w-[160px] flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                View verifications
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingProgram(program);
                  setShowCreateWorkflow(true);
                }}
                className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Edit program
              </button>
              <button
                type="button"
                onClick={() => toggleIntegration(program.id)}
                className="group inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Code className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-600" />
                <span>API</span>
                <ChevronDown
                  className={`h-3 w-3 shrink-0 text-slate-500 transition-transform duration-200 ${
                    integrationOpenId === program.id ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                integrationOpenId === program.id
                  ? "mt-4 max-h-[480px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Developer integration
                </p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-500">
                      Workflow ID
                    </p>
                    <code className="block rounded-lg bg-gray-100 px-2 py-2 font-mono text-xs text-gray-900">
                      {program.workflowId}
                    </code>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-500">
                      API endpoint
                    </p>
                    <code className="block rounded-lg bg-gray-100 px-2 py-2 font-mono text-xs text-gray-900">
                      POST /api/request-verification
                    </code>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-500">
                      Example request
                    </p>
                    <pre className="overflow-x-auto rounded-lg bg-gray-100 p-3 font-mono text-[11px] leading-relaxed text-gray-900">
{`curl -X POST https://your-domain.com/api/request-verification \\
  -H "Content-Type: application/json" \\
  -d '{"workflow":"${program.workflowId}","userEmail":"user@example.com"}'`}
                    </pre>
                  </div>
                  <a
                    href="/integration"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-dokimos-verifier-accent hover:text-dokimos-verifier-accent-hover"
                  >
                    View full API docs
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {showCreateWorkflow && (
        <ProgramModal
          key={editingProgram?.workflowId ?? "create"}
          mode={editingProgram ? "edit" : "create"}
          initialProgram={editingProgram}
          onClose={() => {
            setShowCreateWorkflow(false);
            setEditingProgram(null);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CREATE / EDIT PROGRAM MODAL
// ═══════════════════════════════════════════════════════════════════

function slugifyWorkflowId(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return (s.slice(0, 64) || "workflow").replace(/^_+|_+$/g, "");
}

function ProgramModal({
  onClose,
  mode,
  initialProgram,
}: {
  onClose: () => void;
  mode: "create" | "edit";
  initialProgram: VerificationProgram | null;
}) {
  const [programName, setProgramName] = useState("");
  const [programKey, setProgramKey] = useState("");
  const [purposeLine, setPurposeLine] = useState("");
  const [complianceNote, setComplianceNote] = useState("");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialProgram) {
      setProgramName(initialProgram.name);
      setProgramKey(initialProgram.workflowId);
      setPurposeLine(initialProgram.audienceDescription);
      setComplianceNote(initialProgram.compliance);
      setSelectedAttributes(["ageOver21", "name", "notExpired"]);
      setSlugManual(true);
    } else {
      setProgramName("");
      setProgramKey("");
      setPurposeLine("");
      setComplianceNote("");
      setSelectedAttributes([]);
      setSlugManual(false);
    }
  }, [mode, initialProgram]);

  useEffect(() => {
    if (mode === "create" && !slugManual && programName.trim()) {
      setProgramKey(slugifyWorkflowId(programName));
    }
  }, [programName, mode, slugManual]);

  const toggleAttribute = (attr: string) => {
    if (selectedAttributes.includes(attr)) {
      setSelectedAttributes(selectedAttributes.filter((a) => a !== attr));
    } else {
      setSelectedAttributes([...selectedAttributes, attr]);
    }
  };

  const handleSubmit = () => {
    if (mode === "create") {
      alert(
        `Workflow created.\n\nDevelopers use:\nworkflow: "${programKey}"\nin POST /api/request-verification` +
          (purposeLine ? `\n\nPurpose (for your team): ${purposeLine}` : "")
      );
    } else {
      alert(`Saved changes to “${programName}”.`);
    }
    onClose();
  };

  const isEdit = mode === "edit";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-md px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
            {isEdit ? "Edit verification workflow" : "Create verification workflow"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <p className="text-sm text-gray-500">
            {isEdit
              ? "Update what this workflow verifies and how it appears to your team."
              : "Name the workflow, pick the attributes you need—users share only what you ask for."}
          </p>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-600">
              Workflow name *
            </label>
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g. Host Verification"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-dokimos-verifier-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-600">
              Workflow ID (for API) *
            </label>
            <input
              type="text"
              value={programKey}
              onChange={(e) => {
                setSlugManual(true);
                setProgramKey(
                  e.target.value.toLowerCase().replace(/\s+/g, "_")
                );
              }}
              placeholder="host_verification"
              disabled={isEdit}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-dokimos-verifier-accent disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-gray-500">
              Auto-filled from the workflow name; you can edit before creating.{" "}
              {isEdit ? "ID can’t be changed after creation." : ""}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-600">
              Required attributes *
            </label>
            <p className="mb-3 text-xs text-gray-500">
              Select the information you need from a verified identity.
            </p>
            <div className="max-h-[min(52vh,420px)] space-y-2 overflow-y-auto pr-1">
              {WORKFLOW_ATTRIBUTE_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className="flex cursor-pointer gap-3 rounded-lg border border-gray-300 p-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedAttributes.includes(opt.key)}
                    onChange={() => toggleAttribute(opt.key)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded text-dokimos-verifier-accent focus:ring-dokimos-verifier-accent"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      {opt.title}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {opt.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-600">
              Purpose (optional)
            </label>
            <textarea
              value={purposeLine}
              onChange={(e) => setPurposeLine(e.target.value)}
              placeholder="e.g. Verify host identity before property listing"
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-dokimos-verifier-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-600">
              Compliance note (optional)
            </label>
            <textarea
              value={complianceNote}
              onChange={(e) => setComplianceNote(e.target.value)}
              placeholder="Internal compliance or policy note"
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-dokimos-verifier-accent"
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !programName ||
              !programKey ||
              selectedAttributes.length === 0
            }
            className="rounded-lg bg-dokimos-core px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEdit ? "Save workflow" : "Create workflow"}
          </button>
        </div>
      </div>
    </div>
  );
}

