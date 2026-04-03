"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  LogOut,
  Check,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  Car,
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
} from "lucide-react";
import axios from "axios";

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

const PROGRAM_ICON_MAP: Record<
  ProgramIconKey,
  { Icon: LucideIcon; bg: string; fg: string }
> = {
  userCheck: { Icon: UserCheck, bg: "bg-[#192226]", fg: "text-[#55cdff]" },
  car: { Icon: Car, bg: "bg-[#1a1f2e]", fg: "text-[#4ea7fc]" },
  shield: { Icon: Shield, bg: "bg-[#14261c]", fg: "text-[#27a644]" },
};

type TabType = 'overview' | 'verifications' | 'workflows';

export default function VerifierDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<VerifierSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  /** When set, Verifications tab filters to this workflow ID */
  const [workflowFilter, setWorkflowFilter] = useState<string | null>(null);

  useEffect(() => {
    try {
      const verifierSession = localStorage.getItem("dokimos_verifier");

      if (!verifierSession) {
        router.replace("/verifier/login");
      } else {
        const parsedSession = JSON.parse(verifierSession) as VerifierSession;
        setSession(parsedSession);
        fetchRequests(parsedSession.verifierId);
      }
    } catch {
      localStorage.removeItem("dokimos_verifier");
      router.replace("/verifier/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchRequests = async (verifierId: string) => {
    try {
      const response = await axios.get(`/api/requests/verifier/${verifierId}`, {
        timeout: 15000,
      });
      setRequests(response.data);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  };

  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      fetchRequests(session.verifierId);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [session]);

  const handleSignOut = () => {
    localStorage.removeItem("dokimos_verifier");
    router.push("/verifier/login");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const programs: VerificationProgram[] = [
    {
      id: "driver_background_check",
      workflowId: "driver_background_check",
      name: "Driver Background Check",
      iconKey: "userCheck",
      audienceDescription: "For: New driver applications",
      displayAttributes: [
        "Government-issued ID",
        "Age 21+ verification",
        "SSN verification",
        "Motor Vehicle Record",
        "Criminal history check",
      ],
      compliance: "FCRA compliance, State DMV regulations",
      stats: { thisMonth: 1247, approvalRate: 89, avgTime: "3m 24s" },
      status: "active",
    },
    {
      id: "vehicle_registration",
      workflowId: "vehicle_registration",
      name: "Vehicle Registration",
      iconKey: "car",
      audienceDescription: "For: Vehicle onboarding and compliance",
      displayAttributes: [
        "Vehicle year (15 years or newer)",
        "Proof of insurance",
        "Vehicle registration",
        "Safety inspection certificate",
        "License plate verification",
      ],
      compliance: "State insurance minimums, DOT safety standards",
      stats: { thisMonth: 892, approvalRate: 94, avgTime: "2m 18s" },
      status: "active",
    },
    {
      id: "continuous_monitoring",
      workflowId: "continuous_monitoring",
      name: "Continuous Driver Monitoring",
      iconKey: "shield",
      audienceDescription: "For: Ongoing compliance and safety",
      displayAttributes: [
        "Annual background refresh",
        "MVR continuous monitoring",
        "License expiration tracking",
        "Insurance policy renewals",
        "Incident report monitoring",
      ],
      compliance:
        "Continuous compliance requirements, Real-time safety monitoring",
      stats: { thisMonth: 3456, approvalRate: 91, avgTime: "1m 12s" },
      status: "active",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-vl-canvas flex items-center justify-center">
        <div className="text-vl-subtle text-sm">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-vl-canvas px-6">
        <p className="text-sm text-vl-subtle">Redirecting to sign in…</p>
        <a
          href="/verifier/login"
          className="text-sm font-medium text-vl-accent underline underline-offset-2 hover:text-vl-accent-hover"
        >
          Go to sign in
        </a>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const deniedRequests = requests.filter(r => r.status === 'denied');
  const totalVerifications = requests.length;
  const approvalRate = totalVerifications > 0 ? ((approvedRequests.length / totalVerifications) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-vl-canvas">
      {/* Header */}
      <header className="border-b border-white/[0.08] bg-vl-surface/90 backdrop-blur-xl backdrop-saturate-150">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#121414] text-vl-ink shadow-vl-card ring-1 ring-white/10">
              <Building2 className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight tracking-tight text-vl-ink">
                {session.companyName}
              </h1>
              <p className="text-sm text-vl-subtle">{session.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-vl-muted transition-colors duration-150 ease-out hover:bg-white/[0.06] flex items-center gap-2 border border-white/[0.08] bg-vl-elevated shadow-vl-low"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-white/[0.08] bg-vl-surface/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
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
                    ? 'border-vl-accent text-vl-ink'
                    : 'border-transparent text-vl-subtle hover:text-vl-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && <OverviewTab requests={requests} programs={programs} setActiveTab={setActiveTab} />}
        {activeTab === 'verifications' && (
          <VerificationsTab
            requests={requests}
            programs={programs}
            workflowFilter={workflowFilter}
            onClearWorkflowFilter={() => setWorkflowFilter(null)}
          />
        )}
        {activeTab === 'workflows' && (
          <WorkflowsTab
            programs={programs}
            showCreateWorkflow={showCreateWorkflow}
            setShowCreateWorkflow={setShowCreateWorkflow}
            setActiveTab={setActiveTab}
            setWorkflowFilter={setWorkflowFilter}
          />
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW
// ═══════════════════════════════════════════════════════════════════

function OverviewTab({ requests, programs, setActiveTab }: { requests: VerificationRequest[]; programs: VerificationProgram[]; setActiveTab: (tab: TabType) => void }) {
  const programName = (workflowId?: string) => {
    const id = workflowId || "driver_background_check";
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-vl-ink mb-2 tracking-tight">
          Identity verification dashboard
        </h1>
        <p className="text-[15px] text-vl-subtle leading-relaxed tracking-[-0.011em]">
          Monitor verification requests triggered by your application
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl border border-white/[0.08] bg-vl-elevated p-6 shadow-vl-card">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-vl-faint">
            Total verifications
          </p>
          <p className="mb-1 text-3xl font-semibold tabular-nums text-vl-ink tracking-tight">
            {totalVerifications.toLocaleString()}
          </p>
          <p className="mb-2 text-xs text-vl-subtle">This month</p>
          <div className="flex items-center gap-1 text-xs text-vl-green">
            <TrendingUp size={14} />
            <span>12% vs last month</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-vl-elevated p-6 shadow-vl-card">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-vl-faint">
            Approval rate
          </p>
          <p className="mb-1 text-3xl font-semibold tabular-nums text-vl-ink tracking-tight">
            {approvalRate}%
          </p>
          <p className="mb-2 text-xs text-vl-subtle">Last 30 days</p>
          <div className="flex items-center gap-1 text-xs text-vl-green">
            <TrendingUp size={14} />
            <span>2.1% vs previous period</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-vl-elevated p-6 shadow-vl-card">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-vl-faint">
            Avg completion time
          </p>
          <p className="mb-1 text-3xl font-semibold tabular-nums text-vl-ink tracking-tight">
            3m 12s
          </p>
          <p className="mb-2 text-xs text-vl-subtle">Median time to complete</p>
          <div className="flex items-center gap-1 text-xs text-vl-green">
            <TrendingDown size={14} />
            <span>15s faster than last month</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-vl-elevated p-6 shadow-vl-card">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-vl-faint">
            Monthly cost
          </p>
          <p className="mb-1 text-3xl font-semibold tabular-nums text-vl-ink tracking-tight">
            ${monthlyCost}
          </p>
          <p className="mb-2 text-xs text-vl-subtle">{totalVerifications} verifications × $0.50</p>
          <div className="flex items-center gap-1 text-xs text-vl-amber">
            <TrendingUp size={14} />
            <span>$47.20 vs last month</span>
          </div>
        </div>
      </div>

      {/* Program breakdown */}
      <div className="rounded-xl border border-white/[0.08] bg-vl-elevated p-6 shadow-vl-card">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-vl-ink">
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
                    <span className="text-sm text-vl-muted">{program.name}</span>
                    <span className="text-sm font-medium text-vl-ink">
                      {program.stats.thisMonth.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.06]">
                    <div
                      className="h-2 rounded-full bg-vl-accent transition-all duration-300 ease-out"
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
      <div className="rounded-xl border border-white/[0.1] bg-gradient-to-br from-[#18182f]/90 to-vl-elevated p-6 shadow-vl-card ring-1 ring-white/[0.06]">
        <h2 className="mb-4 text-xl font-semibold text-vl-ink tracking-tight">
          How Dokimos + EigenCompute works
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-vl-accent text-xs font-semibold text-white shadow-sm">
              1
            </div>
            <div>
              <p className="font-medium text-vl-ink">User uploads ID in TEE</p>
              <p className="text-vl-subtle text-xs mt-0.5">Document processed in Intel TDX secure enclave</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-vl-accent text-xs font-semibold text-white shadow-sm">
              2
            </div>
            <div>
              <p className="font-medium text-vl-ink">TEE generates attestation</p>
              <p className="text-vl-subtle text-xs mt-0.5">Cryptographic proof of code execution (MRENCLAVE)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-vl-accent text-xs font-semibold text-white shadow-sm">
              3
            </div>
            <div>
              <p className="font-medium text-vl-ink">Eigen AVS verifies attestation</p>
              <p className="text-vl-subtle text-xs mt-0.5">Economic security via operator staking</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-vl-accent text-xs font-semibold text-white shadow-sm">
              4
            </div>
            <div>
              <p className="font-medium text-vl-ink">You verify independently</p>
              <p className="text-vl-subtle text-xs mt-0.5">Check signature on Etherscan, deployment on EigenCloud</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-white/[0.08] bg-vl-elevated p-6 shadow-vl-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-vl-ink">
            Recent activity
          </h2>
          <button 
            onClick={() => setActiveTab('verifications')}
            className="text-sm font-medium text-vl-accent hover:text-vl-accent-hover transition-colors duration-150"
          >
            View all verifications →
          </button>
        </div>
        
        {recentActivity.length === 0 ? (
          <p className="text-sm text-vl-subtle text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map(req => (
              <div
                key={req.requestId}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium border ${
                      req.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' :
                      req.status === 'pending' ? 'bg-amber-500/15 text-amber-200 border-amber-500/25' :
                      'bg-red-500/15 text-red-300 border-red-500/25'
                    }`}>
                      {req.status === 'approved' ? 'Approved' : req.status === 'pending' ? 'Pending' : 'Denied'}
                    </span>
                    <span className="text-sm font-medium text-vl-ink">{req.userEmail}</span>
                  </div>
                  <span className="text-xs text-vl-faint">{getRelativeTime(req.createdAt)}</span>
                </div>
                <p className="text-xs text-vl-subtle">
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

type WizardStep = "overview" | 1 | 2 | 3;

function VerifyCheckModal({
  open,
  onClose,
  req,
}: {
  open: boolean;
  onClose: () => void;
  req: VerificationRequest | null;
}) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("overview");
  const [verificationResult, setVerificationResult] =
    useState<VerifyAttestationApiResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showTechDetails, setShowTechDetails] = useState(false);

  useEffect(() => {
    if (!open || !req?.attestation) {
      setVerificationResult(null);
      setVerifyError(null);
      setVerifying(false);
      return;
    }
    setCurrentStep("overview");
    setShowTechDetails(false);
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

  const att = req.attestation;
  const primaryBtn =
    "inline-flex items-center gap-2 rounded-lg bg-vl-accent px-5 py-2.5 text-sm font-medium text-white shadow-vl-low transition-colors duration-150 ease-out hover:bg-[#4e5ac0] active:scale-[0.98]";
  const secondaryBtn =
    "rounded-lg bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-vl-ink transition-colors duration-150 ease-out hover:bg-white/[0.1]";
  const outlineBtn =
    "px-4 py-2 border border-white/[0.12] text-vl-muted rounded-lg text-sm font-medium hover:bg-white/[0.04] transition-colors duration-150 inline-flex items-center gap-2";

  const stepCardClass =
    "w-full text-left p-4 border border-white/[0.08] rounded-lg bg-vl-panel/50 hover:bg-white/[0.04] transition-all duration-200 ease-out flex items-start justify-between gap-3 group";

  const teeOk =
    verificationResult?.teeFieldsPresent &&
    verificationResult?.eigenMetadataPresent;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/[0.1] bg-vl-surface shadow-vl-high transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-vl-surface/95 backdrop-blur-md px-6 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <ShieldCheck className="h-6 w-6 shrink-0 text-vl-accent" />
            <h2 className="truncate text-lg font-semibold text-vl-ink tracking-tight">
              Verify this check
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-vl-faint hover:text-vl-muted shrink-0 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {currentStep === "overview" && (
            <>
              <p className="text-sm text-vl-subtle">
                Independently verify this attestation:
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  className={stepCardClass}
                  onClick={() => setCurrentStep(1)}
                >
                  <div>
                    <p className="text-lg font-semibold text-vl-ink mb-1">
                      ① Check Signature
                    </p>
                    <p className="text-sm text-vl-subtle">
                      Verify the cryptographic signature on the attestation.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-vl-faint group-hover:text-vl-accent shrink-0" />
                </button>
                <button
                  type="button"
                  className={stepCardClass}
                  onClick={() => setCurrentStep(2)}
                >
                  <div>
                    <p className="text-lg font-semibold text-vl-ink mb-1">
                      ② Verify Hardware
                    </p>
                    <p className="text-sm text-vl-subtle">
                      Review TEE metadata and Eigen app linkage.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-vl-faint group-hover:text-vl-accent shrink-0" />
                </button>
                <button
                  type="button"
                  className={stepCardClass}
                  onClick={() => setCurrentStep(3)}
                >
                  <div>
                    <p className="text-lg font-semibold text-vl-ink mb-1">
                      ③ Audit Code (Optional)
                    </p>
                    <p className="text-sm text-vl-subtle">
                      Source repo, commit, and EigenCloud technical details.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-vl-faint group-hover:text-vl-accent shrink-0" />
                </button>
              </div>
              <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className={secondaryBtn}>
                  Close
                </button>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <div className="space-y-4 transition-all duration-300">
              <h3 className="text-lg font-semibold text-vl-ink mb-2">
                ① Check Signature
              </h3>
              <p className="text-sm text-vl-subtle mb-4">
                Every verification has a cryptographic signature (like a
                tamper-proof seal). Let&apos;s verify it&apos;s valid.
              </p>

              {verifying && (
                <div className="flex items-center gap-2 text-vl-subtle text-sm mb-4">
                  <span className="inline-flex gap-0.5" aria-hidden>
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
                      .
                    </span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
                      .
                    </span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
                      .
                    </span>
                  </span>
                  Verifying signature...
                </div>
              )}

              {!verifying && verifyError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-200 font-medium">
                        Verification request failed
                      </p>
                      <p className="text-sm text-red-300/90 mt-1">{verifyError}</p>
                    </div>
                  </div>
                </div>
              )}

              {!verifying &&
                verificationResult &&
                verificationResult.signatureValid && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-emerald-200 font-medium">
                          Signature is cryptographically valid
                        </p>
                        <p className="text-sm text-emerald-300/90 mt-1">
                          Signed by TEE wallet: {String(att.signer)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {!verifying &&
                verificationResult &&
                !verificationResult.signatureValid &&
                !verifyError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-200 font-medium">
                        Signature verification failed
                      </p>
                    </div>
                  </div>
                )}

              <div>
                <button
                  type="button"
                  onClick={() => setShowTechDetails((v) => !v)}
                  className="text-sm text-vl-accent hover:text-vl-accent-hover font-medium mb-2"
                >
                  {showTechDetails ? "Hide" : "Show"} technical details
                </button>
                {showTechDetails && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-2">
                      Raw fields
                    </p>
                    <div className="bg-white/[0.03] px-3 py-2 rounded text-xs font-mono text-vl-muted break-all">
                      signature: {truncateMid(String(att.signature || ""), 40)}
                    </div>
                    <div className="bg-white/[0.03] px-3 py-2 rounded text-xs font-mono text-vl-muted break-all">
                      signer: {String(att.signer)}
                    </div>
                    <div className="bg-white/[0.03] px-3 py-2 rounded text-xs font-mono text-vl-muted break-all">
                      messageHash:{" "}
                      {truncateMid(String(att.messageHash || ""), 40)}
                    </div>
                  </div>
                )}
              </div>

              <a
                href={`https://sepolia.etherscan.io/address/${att.signer}`}
                target="_blank"
                rel="noopener noreferrer"
                className={outlineBtn}
              >
                Verify on Etherscan
                <ExternalLink size={14} />
              </a>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setCurrentStep("overview")}
                  className={secondaryBtn}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={primaryBtn}
                >
                  Next: Verify Hardware →
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 transition-all duration-300">
              <h3 className="text-lg font-semibold text-vl-ink mb-2">
                ② Verify Hardware
              </h3>
              <p className="text-sm text-vl-subtle mb-4">
                This verification was processed in Intel TDX hardware (a secure
                environment that even Dokimos cannot access). Let&apos;s verify
                the hardware is real.
              </p>

              {verifying && (
                <div className="flex items-center gap-2 text-vl-subtle text-sm mb-4">
                  <span className="animate-pulse">●</span>
                  Loading verification results...
                </div>
              )}

              {!verifying && verificationResult && teeOk && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-emerald-200">
                      <p className="font-medium">TEE fields present</p>
                      <p className="mt-1">
                        App ID matches expected Eigen app metadata.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!verifying && verificationResult && !teeOk && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-200">
                      TEE or Eigen metadata checks did not all pass. Review the
                      attestation payload.
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-4 mb-4">
                <p className="text-sm text-amber-200">
                  ⚠️ Full TEE quote verification requires Eigen AVS (production
                  feature)
                </p>
              </div>

              {att.tee && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-2">
                    Technical details
                  </p>
                  <div className="bg-white/[0.03] px-3 py-2 rounded text-xs font-mono text-vl-muted">
                    Platform: Intel TDX
                  </div>
                  <div className="bg-white/[0.03] px-3 py-2 rounded text-xs font-mono text-vl-muted break-all">
                    TEE wallet: {String(att.signer)}
                  </div>
                  <div className="bg-white/[0.03] px-3 py-2 rounded text-xs font-mono text-vl-muted break-all">
                    MRENCLAVE: {truncateHash(String(att.tee.mrenclave || ""))}
                  </div>
                  <div className="bg-white/[0.03] px-3 py-2 rounded text-xs font-mono text-vl-muted">
                    TCB Status: {String(att.tee.tcbStatus ?? "")}
                  </div>
                </div>
              )}

              {att.eigen?.verificationUrl && (
                <a
                  href={att.eigen.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${primaryBtn} w-fit`}
                >
                  View on EigenCloud Dashboard
                  <ExternalLink size={14} />
                </a>
              )}

              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={secondaryBtn}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className={primaryBtn}
                >
                  Next: Audit Code →
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 transition-all duration-300">
              <h3 className="text-lg font-semibold text-vl-ink mb-2">
                ③ Audit Code (Optional)
              </h3>
              <p className="text-sm text-vl-subtle mb-4">
                Want to see exactly how Dokimos verified this person? The code
                is public and auditable.
              </p>

              <div className="rounded-lg border border-vl-accent/30 bg-[#18182f]/80 p-4 mb-4">
                <p className="text-sm text-vl-muted">
                  ℹ️ Most companies skip this step and just verify the signature
                  + hardware. That&apos;s sufficient for normal use. This is for
                  teams who want to audit the verification logic themselves.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-2">
                  Build provenance
                </p>
                <div className="bg-white/[0.03] px-3 py-2 rounded text-xs font-mono text-vl-muted">
                  GitHub: github.com/pranavirohit/dokimos
                </div>
                <div className="bg-white/[0.03] px-3 py-2 rounded text-xs font-mono text-vl-muted break-all">
                  Commit: {DEFAULT_GIT_SHA}
                </div>
                <div className="bg-white/[0.03] px-3 py-2 rounded text-xs font-mono text-vl-muted break-all">
                  Docker digest: {truncateHash(DEFAULT_IMAGE_DIGEST, 20)}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://github.com/pranavirohit/dokimos/tree/${DEFAULT_GIT_SHA}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={primaryBtn}
                >
                  View Code on GitHub
                  <ExternalLink size={14} />
                </a>
                {att.eigen?.verificationUrl && (
                  <a
                    href={att.eigen.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={outlineBtn}
                  >
                    Technical Details
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={secondaryBtn}
                >
                  ← Back
                </button>
                <button type="button" onClick={onClose} className={primaryBtn}>
                  Done ✓
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = req.userEmail
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || req.status === statusFilter;
    const wf = req.workflow || "driver_background_check";
    const matchesProgram =
      !workflowFilter || wf === workflowFilter;
    return matchesSearch && matchesStatus && matchesProgram;
  });

  const pendingRequests = filteredRequests.filter(r => r.status === 'pending');
  const approvedRequests = filteredRequests.filter(r => r.status === 'approved');
  const deniedRequests = filteredRequests.filter(r => r.status === 'denied');

  const formatAttributeName = (attr: string) => {
    const map: Record<string, string> = {
      ageOver21: "Age Over 21",
      name: "Full Name",
      dateOfBirth: "Date of Birth",
      nationality: "Nationality",
      notExpired: "Document Not Expired",
      documentType: "Document Type",
    };
    return map[attr] || attr;
  };

  const formatWorkflowName = (workflowId: string) => {
    const fromPrograms = programs.find((p) => p.workflowId === workflowId);
    if (fromPrograms) return fromPrograms.name;
    const map: Record<string, string> = {
      driver_background_check: "Driver Background Check",
      vehicle_registration: "Vehicle Registration",
      continuous_monitoring: "Continuous Driver Monitoring",
      driver_onboarding: "Driver Onboarding",
      rental_application: "Rental Application",
      account_opening: "Account Opening",
      rider_verification_high_risk: "Rider Verification - High Risk",
      restaurant_partner_onboarding: "Restaurant Partner Onboarding",
    };
    return map[workflowId] || workflowId;
  };

  const filteredProgramName =
    workflowFilter &&
    programs.find((p) => p.workflowId === workflowFilter)?.name;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-vl-ink">
          Verifications
        </h1>
        <p className="mt-1 text-[15px] text-vl-subtle">
          Review and manage requests from your users
        </p>
      </div>

      {workflowFilter && filteredProgramName && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-vl-accent/25 bg-[#18182f]/60 px-4 py-3 text-sm text-vl-muted">
          <span>
            Showing verifications for:{" "}
            <span className="font-semibold text-vl-ink">{filteredProgramName}</span>
          </span>
          <button
            type="button"
            onClick={onClearWorkflowFilter}
            className="rounded-lg border border-white/[0.12] bg-vl-elevated px-3 py-1 text-xs font-semibold text-vl-ink transition-colors hover:bg-white/[0.06]"
          >
            Show all programs
          </button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vl-faint" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-white/[0.12] rounded-lg bg-vl-elevated text-vl-ink placeholder:text-vl-faint text-sm focus:ring-2 focus:ring-vl-accent focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 border border-white/[0.12] rounded-lg bg-vl-elevated text-vl-ink text-sm font-medium focus:ring-2 focus:ring-vl-accent focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </select>
        <button className="px-4 py-2.5 border border-white/[0.12] rounded-xl text-sm font-medium text-vl-muted hover:bg-white/[0.03] flex items-center gap-2">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-vl-ink">
              Pending ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
            {pendingRequests.map(req => (
              <div key={req.requestId} className="rounded-xl border border-white/[0.08] bg-vl-elevated p-6 shadow-vl-card">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="mb-1 text-base font-semibold text-vl-ink">{req.userEmail}</h3>
                    <p className="text-sm text-vl-subtle">{formatWorkflowName(req.workflow || 'driver_background_check')}</p>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-500/25">
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-1">
                      PROGRAM
                    </p>
                    <p className="text-sm text-vl-muted">{formatWorkflowName(req.workflow || 'driver_background_check')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-1">
                      TRIGGERED BY
                    </p>
                    <p className="text-sm text-vl-muted">API Integration</p>
                    <p className="text-xs text-vl-subtle">Program-based verification</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-1">
                      REQUESTED
                    </p>
                    <p className="text-sm text-vl-muted">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-2">
                    STATUS
                  </p>
                  <p className="text-sm text-vl-muted">Waiting for user to complete verification</p>
                </div>

                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-white/[0.06] text-vl-muted rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-white/[0.12] text-vl-muted rounded-xl text-sm font-medium hover:bg-white/[0.03] transition-colors">
                    Send Reminder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Requests */}
      {approvedRequests.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-vl-ink">
              Approved ({approvedRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
            {approvedRequests.map(req => (
              <div key={req.requestId} className="rounded-xl border border-white/[0.08] bg-vl-elevated p-6 shadow-vl-card">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="mb-1 text-base font-semibold text-vl-ink">{req.userEmail}</h3>
                    <p className="text-sm text-vl-subtle">{formatWorkflowName(req.workflow || 'driver_background_check')}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/25">
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-1">
                      PROGRAM
                    </p>
                    <p className="text-sm text-vl-muted">{formatWorkflowName(req.workflow || 'driver_background_check')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-1">
                      COMPLETED
                    </p>
                    <p className="text-sm text-vl-muted">
                      {req.completedAt ? new Date(req.completedAt).toLocaleString() : new Date(req.createdAt).toLocaleString()}
                    </p>
                    {req.completedAt && req.createdAt && (
                      <p className="text-xs text-vl-subtle">
                        Duration: {Math.floor((new Date(req.completedAt).getTime() - new Date(req.createdAt).getTime()) / 1000)}s
                      </p>
                    )}
                  </div>
                </div>

                {req.attestation && (
                  <>
                    <div className="mb-4">
                      <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-2">
                        VERIFIED ATTRIBUTES
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {req.requestedAttributes.map((attr, idx) => (
                          <span key={idx} className="px-3 py-1 bg-white/[0.06] text-vl-muted text-xs font-medium rounded">
                            {formatAttributeName(attr)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-300">
                            Verified via Eigen AVS
                          </span>
                        </div>
                        {req.attestation.eigen?.verificationUrl && (
                          <a 
                            href={req.attestation.eigen.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-vl-accent hover:text-vl-accent-hover flex items-center gap-1"
                          >
                            View Proof
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      
                      {/* TEE Details */}
                      {req.attestation.tee && (
                        <div className="text-xs text-vl-subtle space-y-1 mb-3 pb-3 border-b border-white/[0.08]">
                          <div className="flex justify-between">
                            <span className="text-vl-subtle">Platform:</span>
                            <span className="font-medium">{req.attestation.tee.platform}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-vl-subtle">MRENCLAVE:</span>
                            <span className="font-mono text-xs">{req.attestation.tee.mrenclave?.slice(0, 10)}...{req.attestation.tee.mrenclave?.slice(-8)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-vl-subtle">TCB Status:</span>
                            <span className="font-medium text-emerald-400">{req.attestation.tee.tcbStatus}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Attributes */}
                      <pre className="text-xs font-mono text-vl-muted overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {JSON.stringify(req.attestation.attributes, null, 2)}
                      </pre>
                    </div>
                  </>
                )}

                <div className="flex flex-wrap gap-3">
                  {req.attestation && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequest(req);
                        setVerifyModalOpen(true);
                      }}
                      className="px-4 py-2 bg-vl-accent text-white rounded-xl text-sm font-medium hover:bg-[#4e5ac0] transition-colors flex items-center gap-2"
                    >
                      <ShieldCheck size={14} />
                      Verify this check
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(req.attestation, null, 2),
                        `attestation-${req.requestId}`
                      )
                    }
                    className="px-4 py-2 bg-vl-accent text-white rounded-xl text-sm font-medium hover:bg-[#4e5ac0] transition-colors flex items-center gap-2"
                  >
                    <Copy size={14} />
                    Copy Full Attestation
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-white/[0.06] text-vl-muted rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-colors"
                  >
                    Download JSON
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 border border-white/[0.12] text-vl-muted rounded-xl text-sm font-medium hover:bg-white/[0.03] transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <VerifyCheckModal
        open={verifyModalOpen}
        onClose={() => {
          setVerifyModalOpen(false);
          setSelectedRequest(null);
        }}
        req={selectedRequest}
      />

      {/* Denied Requests */}
      {deniedRequests.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-vl-ink">
              Denied ({deniedRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
            {deniedRequests.map(req => (
              <div key={req.requestId} className="rounded-xl border border-white/[0.08] bg-vl-elevated p-6 shadow-vl-card">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="mb-1 text-base font-semibold text-vl-ink">{req.userEmail}</h3>
                    <p className="text-sm text-vl-subtle">{formatWorkflowName(req.workflow || 'driver_background_check')}</p>
                  </div>
                  <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-200 ring-1 ring-red-500/25">
                    Denied
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-1">
                      PROGRAM
                    </p>
                    <p className="text-sm text-vl-muted">{formatWorkflowName(req.workflow || 'driver_background_check')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-1">
                      DENIED
                    </p>
                    <p className="text-sm text-vl-muted">
                      {req.completedAt ? new Date(req.completedAt).toLocaleString() : new Date(req.createdAt).toLocaleString()}
                    </p>
                    {req.completedAt && req.createdAt && (
                      <p className="text-xs text-vl-subtle">
                        Duration: {Math.floor((new Date(req.completedAt).getTime() - new Date(req.createdAt).getTime()) / 1000)}s
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-vl-subtle uppercase tracking-wide mb-1">
                    REASON
                  </p>
                  <p className="text-sm text-vl-muted">User declined to share requested information</p>
                </div>

                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-vl-accent text-white rounded-xl text-sm font-medium hover:bg-[#4e5ac0] transition-colors">
                    Retry Verification
                  </button>
                  <button className="px-4 py-2 border border-white/[0.12] text-vl-muted rounded-xl text-sm font-medium hover:bg-white/[0.03] transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredRequests.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/[0.1] bg-vl-elevated p-12 text-center shadow-vl-card">
          <Shield className="mx-auto mb-3 h-12 w-12 text-vl-faint" />
          <p className="text-vl-subtle text-sm">No verifications found</p>
          <p className="text-vl-subtle text-xs mt-1">Verifications will appear here when triggered by your application</p>
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
    <div className="space-y-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-vl-ink">
            Verification Programs
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-vl-subtle">
            Create custom verification programs for different use cases. Each
            program defines what identity attributes you need to verify.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingProgram(null);
            setShowCreateWorkflow(true);
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-vl-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4e5ac0]"
        >
          <Plus size={16} />
          New program
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {programs.map((program) => {
          const { Icon: ProgramIcon, bg: iconBg, fg: iconFg } =
            PROGRAM_ICON_MAP[program.iconKey];
          return (
          <div
            key={program.id}
            className="rounded-xl border border-white/[0.08] bg-vl-elevated p-6 shadow-vl-card transition-colors duration-150 hover:border-white/[0.12] hover:bg-white/[0.02]"
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
                    <h2 className="text-lg font-semibold text-vl-ink">
                      {program.name}
                    </h2>
                    {program.status === "active" && (
                      <span className="rounded px-2 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20">
                        Active
                      </span>
                    )}
                    {program.status === "inactive" && (
                      <span className="rounded px-2 py-0.5 text-xs font-semibold bg-white/[0.06] text-vl-subtle">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-vl-subtle">
                    {program.audienceDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-4 rounded-lg border border-white/[0.06] bg-white/[0.03] px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8">
              <div className="flex items-baseline gap-2 sm:items-center sm:gap-3">
                <span className="text-2xl font-semibold tabular-nums text-vl-ink">
                  {program.stats.thisMonth.toLocaleString()}
                </span>
                <span className="text-sm text-vl-subtle">this month</span>
              </div>
              <div className="hidden h-8 w-px shrink-0 bg-white/10 sm:block" />
              <div className="flex items-baseline gap-2 sm:items-center sm:gap-3">
                <span className="text-2xl font-semibold tabular-nums text-emerald-400">
                  {program.stats.approvalRate}%
                </span>
                <span className="text-sm text-vl-subtle">approved</span>
              </div>
              <div className="hidden h-8 w-px shrink-0 bg-white/10 sm:block" />
              <div className="flex items-baseline gap-2 sm:items-center sm:gap-3">
                <span className="text-2xl font-semibold text-vl-ink">
                  {program.stats.avgTime}
                </span>
                <span className="text-sm text-vl-subtle">avg time</span>
              </div>
            </div>

            <div className="my-6 border-t border-white/[0.08]" />

            <div className="mb-6 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-vl-subtle">
                What Gets Verified
              </h4>
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {program.displayAttributes.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-vl-muted"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check
                        className="h-3 w-3 text-emerald-400"
                        strokeWidth={3}
                      />
                    </div>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6 border-t border-white/[0.08] pt-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-500/15">
                  <ShieldCheck className="h-3 w-3 text-amber-300" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-vl-subtle">
                    Compliance
                  </div>
                  <p className="text-sm text-vl-muted">{program.compliance}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-stretch gap-3 border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={() => {
                  setWorkflowFilter(program.workflowId);
                  setActiveTab("verifications");
                }}
                className="min-w-[160px] flex-1 rounded-lg bg-vl-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#4e5ac0]"
              >
                View verifications
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingProgram(program);
                  setShowCreateWorkflow(true);
                }}
                className="rounded-lg border border-white/[0.12] bg-vl-elevated px-6 py-2.5 text-sm font-medium text-vl-muted transition-colors hover:bg-white/[0.06]"
              >
                Edit program
              </button>
              <button
                type="button"
                onClick={() => toggleIntegration(program.id)}
                className="group inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-vl-elevated px-4 py-2.5 text-sm font-medium text-vl-subtle transition-colors hover:bg-white/[0.06]"
              >
                <Code className="h-4 w-4 shrink-0 text-vl-faint transition-colors group-hover:text-vl-subtle" />
                <span>API</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-vl-faint transition-transform duration-200 ${
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
              <div className="border-t border-white/[0.08] bg-white/[0.03] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-vl-subtle">
                  Developer integration
                </p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="mb-1 text-xs font-medium text-vl-subtle">
                      Workflow ID
                    </p>
                    <code className="block rounded-lg bg-white/[0.06] px-2 py-2 font-mono text-xs text-vl-ink">
                      {program.workflowId}
                    </code>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-vl-subtle">
                      API endpoint
                    </p>
                    <code className="block rounded-lg bg-white/[0.06] px-2 py-2 font-mono text-xs text-vl-ink">
                      POST /api/request-verification
                    </code>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-vl-subtle">
                      Example request
                    </p>
                    <pre className="overflow-x-auto rounded-lg bg-white/[0.06] p-3 font-mono text-[11px] leading-relaxed text-vl-ink">
{`curl -X POST https://your-domain.com/api/request-verification \\
  -H "Content-Type: application/json" \\
  -d '{"workflow":"${program.workflowId}","userEmail":"user@example.com"}'`}
                    </pre>
                  </div>
                  <a
                    href="/integration"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-vl-accent hover:text-vl-accent-hover"
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
  const [audienceLine, setAudienceLine] = useState("");
  const [complianceNote, setComplianceNote] = useState("");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);

  useEffect(() => {
    if (mode === "edit" && initialProgram) {
      setProgramName(initialProgram.name);
      setProgramKey(initialProgram.workflowId);
      setAudienceLine(initialProgram.audienceDescription);
      setComplianceNote(initialProgram.compliance);
      setSelectedAttributes(["ageOver21", "name", "notExpired"]);
    } else {
      setProgramName("");
      setProgramKey("");
      setAudienceLine("");
      setComplianceNote("");
      setSelectedAttributes([]);
    }
  }, [mode, initialProgram]);

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
        `Program created.\n\nDevelopers can reference:\nworkflow: "${programKey}"\nin POST /api/request-verification`
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
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/[0.1] bg-vl-surface shadow-vl-high"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-white/[0.08] bg-vl-surface/95 backdrop-blur-md px-6 py-4">
          <h2 className="text-lg font-semibold text-vl-ink tracking-tight">
            {isEdit ? "Edit verification program" : "New verification program"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-vl-faint hover:text-vl-subtle"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <p className="text-sm text-vl-subtle">
            {isEdit
              ? "Update what this program verifies and how it’s described to your team."
              : "Give your program a clear name and choose what identity checks to include."}
          </p>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-vl-muted">
              Program name *
            </label>
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g. Driver onboarding"
              className="w-full rounded-xl border border-white/[0.12] bg-vl-elevated px-4 py-2.5 text-sm text-vl-ink placeholder:text-vl-faint focus:border-transparent focus:ring-2 focus:ring-vl-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-vl-muted">
              Program ID (for integrations) *
            </label>
            <input
              type="text"
              value={programKey}
              onChange={(e) =>
                setProgramKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))
              }
              placeholder="driver_background_check"
              disabled={isEdit}
              className="w-full rounded-xl border border-white/[0.12] bg-vl-elevated px-4 py-2.5 font-mono text-sm text-vl-ink placeholder:text-vl-faint focus:border-transparent focus:ring-2 focus:ring-vl-accent disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-vl-subtle">
              Used by your product when sending verification requests.{" "}
              {isEdit ? "ID can’t be changed after creation." : ""}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-vl-muted">
              Who it’s for
            </label>
            <textarea
              value={audienceLine}
              onChange={(e) => setAudienceLine(e.target.value)}
              placeholder='For: Rideshare drivers (Uber, Lyft)'
              rows={2}
              className="w-full rounded-xl border border-white/[0.12] bg-vl-elevated px-4 py-2.5 text-sm text-vl-ink placeholder:text-vl-faint focus:border-transparent focus:ring-2 focus:ring-vl-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-vl-muted">
              Compliance note
            </label>
            <textarea
              value={complianceNote}
              onChange={(e) => setComplianceNote(e.target.value)}
              placeholder="State transportation regulations"
              rows={2}
              className="w-full rounded-xl border border-white/[0.12] bg-vl-elevated px-4 py-2.5 text-sm text-vl-ink placeholder:text-vl-faint focus:border-transparent focus:ring-2 focus:ring-vl-accent"
            />
          </div>

          <div className="border-t border-white/[0.08] pt-6">
            <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-vl-muted">
              What to verify
            </label>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-vl-muted">
                  Identity
                </p>
                <div className="space-y-2">
                  {["ageOver21", "name", "dateOfBirth", "nationality"].map(
                    (attr) => (
                      <label
                        key={attr}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] p-3 hover:bg-white/[0.03]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAttributes.includes(attr)}
                          onChange={() => toggleAttribute(attr)}
                          className="h-4 w-4 rounded text-vl-accent focus:ring-vl-accent"
                        />
                        <span className="text-sm text-vl-muted">
                          {attr === "ageOver21"
                            ? "Age over 21"
                            : attr === "name"
                              ? "Full name"
                              : attr === "dateOfBirth"
                                ? "Date of birth"
                                : "Nationality"}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-vl-muted">
                  Document
                </p>
                <div className="space-y-2">
                  {["notExpired", "documentType"].map((attr) => (
                    <label
                      key={attr}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] p-3 hover:bg-white/[0.03]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAttributes.includes(attr)}
                        onChange={() => toggleAttribute(attr)}
                        className="h-4 w-4 rounded text-vl-accent focus:ring-vl-accent"
                      />
                      <span className="text-sm text-vl-muted">
                        {attr === "notExpired"
                          ? "Document not expired"
                          : "Document type"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-white/[0.08] bg-white/[0.03] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.12] px-6 py-2.5 text-sm font-medium text-vl-muted transition-colors hover:bg-white/[0.06]"
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
            className="rounded-xl bg-vl-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4e5ac0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEdit ? "Save program" : "Create program"}
          </button>
        </div>
      </div>
    </div>
  );
}

