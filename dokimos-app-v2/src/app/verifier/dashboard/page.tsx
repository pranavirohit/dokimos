"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LogOut, CheckCircle, Clock, XCircle, Shield, ExternalLink, Copy, TrendingUp, TrendingDown, DollarSign, Timer, Search, Filter, Download, Plus, X } from "lucide-react";
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

interface Workflow {
  id: string;
  name: string;
  workflowId: string;
  description: string;
  requiredAttributes: string[];
  monthlyUsage: number;
  approvalRate: number;
  avgCompletionTime: string;
  complianceNote: string;
  status: 'active' | 'inactive';
}

type TabType = 'overview' | 'verifications' | 'workflows';

export default function VerifierDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<VerifierSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);

  useEffect(() => {
    const verifierSession = localStorage.getItem("dokimos_verifier");
    
    if (!verifierSession) {
      router.push("/verifier/login");
    } else {
      const parsedSession = JSON.parse(verifierSession);
      setSession(parsedSession);
      fetchRequests(parsedSession.verifierId);
    }
    
    setLoading(false);
  }, [router]);

  const fetchRequests = async (verifierId: string) => {
    try {
      const response = await axios.get(`/api/requests/verifier/${verifierId}`);
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

  const workflows: Workflow[] = [
    {
      id: 'wf_001',
      name: 'Driver Onboarding',
      workflowId: 'driver_onboarding',
      description: 'Verify driver eligibility for rideshare platform',
      requiredAttributes: ['ageOver21', 'name', 'notExpired', 'documentType'],
      monthlyUsage: 1247,
      approvalRate: 89,
      avgCompletionTime: '3m 24s',
      complianceNote: 'State transportation regulations',
      status: 'active'
    },
    {
      id: 'wf_002',
      name: 'Rider Verification - High Risk',
      workflowId: 'rider_verification_high_risk',
      description: 'New rider signup with anonymous payment method',
      requiredAttributes: ['name', 'dateOfBirth', 'notExpired'],
      monthlyUsage: 234,
      approvalRate: 76,
      avgCompletionTime: '2m 18s',
      complianceNote: 'Fraud prevention measure',
      status: 'active'
    },
    {
      id: 'wf_003',
      name: 'Restaurant Partner Onboarding',
      workflowId: 'restaurant_partner_onboarding',
      description: 'Restaurant applies to join Uber Eats',
      requiredAttributes: ['name', 'dateOfBirth', 'nationality', 'notExpired'],
      monthlyUsage: 89,
      approvalRate: 92,
      avgCompletionTime: '48h 12m',
      complianceNote: 'Payment processing requirements',
      status: 'active'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const deniedRequests = requests.filter(r => r.status === 'denied');
  const totalVerifications = requests.length;
  const approvalRate = totalVerifications > 0 ? ((approvedRequests.length / totalVerifications) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-slate-900" style={{ fontFamily: "Inter, sans-serif" }}>
                {session.companyName}
              </h1>
              <p className="text-sm text-slate-500">{session.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'verifications', label: 'Verifications' },
              { id: 'workflows', label: 'Workflows' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
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
        {activeTab === 'overview' && <OverviewTab requests={requests} workflows={workflows} setActiveTab={setActiveTab} />}
        {activeTab === 'verifications' && <VerificationsTab requests={requests} />}
        {activeTab === 'workflows' && <WorkflowsTab workflows={workflows} showCreateWorkflow={showCreateWorkflow} setShowCreateWorkflow={setShowCreateWorkflow} />}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW
// ═══════════════════════════════════════════════════════════════════

function OverviewTab({ requests, workflows, setActiveTab }: { requests: VerificationRequest[]; workflows: Workflow[]; setActiveTab: (tab: TabType) => void }) {
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
        <h1 className="text-2xl font-semibold text-slate-900 mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
          Identity Verification Dashboard
        </h1>
        <p className="text-sm text-slate-600">
          Monitor verification requests triggered by your application
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            TOTAL VERIFICATIONS
          </p>
          <p className="text-3xl font-semibold text-slate-900 mb-1">
            {totalVerifications.toLocaleString()}
          </p>
          <p className="text-xs text-slate-600 mb-2">This month</p>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp size={14} />
            <span>12% vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            APPROVAL RATE
          </p>
          <p className="text-3xl font-semibold text-slate-900 mb-1">
            {approvalRate}%
          </p>
          <p className="text-xs text-slate-600 mb-2">Last 30 days</p>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp size={14} />
            <span>2.1% vs previous period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            AVG COMPLETION TIME
          </p>
          <p className="text-3xl font-semibold text-slate-900 mb-1">
            3m 12s
          </p>
          <p className="text-xs text-slate-600 mb-2">Median time to complete</p>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingDown size={14} />
            <span>15s faster than last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            MONTHLY COST
          </p>
          <p className="text-3xl font-semibold text-slate-900 mb-1">
            ${monthlyCost}
          </p>
          <p className="text-xs text-slate-600 mb-2">{totalVerifications} verifications × $0.50</p>
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <TrendingUp size={14} />
            <span>$47.20 vs last month</span>
          </div>
        </div>
      </div>

      {/* Workflow Breakdown */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          VERIFICATIONS BY WORKFLOW
        </h2>
        <div className="space-y-4">
          {workflows.map(workflow => {
            const percentage = ((workflow.monthlyUsage / 1570) * 100).toFixed(0);
            return (
              <div key={workflow.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-700">{workflow.name}</span>
                  <span className="text-sm font-medium text-slate-900">
                    {workflow.monthlyUsage.toLocaleString()} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works - Eigen Integration Explainer */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          How Dokimos + EigenCompute Works
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              1
            </div>
            <div>
              <p className="font-medium text-slate-900">User uploads ID in TEE</p>
              <p className="text-slate-600 text-xs mt-0.5">Document processed in Intel TDX secure enclave</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              2
            </div>
            <div>
              <p className="font-medium text-slate-900">TEE generates attestation</p>
              <p className="text-slate-600 text-xs mt-0.5">Cryptographic proof of code execution (MRENCLAVE)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              3
            </div>
            <div>
              <p className="font-medium text-slate-900">Eigen AVS verifies attestation</p>
              <p className="text-slate-600 text-xs mt-0.5">Economic security via operator staking</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              4
            </div>
            <div>
              <p className="font-medium text-slate-900">You verify independently</p>
              <p className="text-slate-600 text-xs mt-0.5">Check signature on Etherscan, deployment on EigenCloud</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            RECENT ACTIVITY
          </h2>
          <button 
            onClick={() => setActiveTab('verifications')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Verifications →
          </button>
        </div>
        
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map(req => (
              <div key={req.requestId} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      req.status === 'approved' ? 'bg-green-100 text-green-700' :
                      req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {req.status.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-slate-900">{req.userEmail}</span>
                  </div>
                  <span className="text-xs text-slate-500">{getRelativeTime(req.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-600">
                  Driver Onboarding · {req.requestedAttributes.length} attributes
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
// TAB 2: VERIFICATIONS
// ═══════════════════════════════════════════════════════════════════

function VerificationsTab({ requests }: { requests: VerificationRequest[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
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
    const map: Record<string, string> = {
      driver_onboarding: "Driver Onboarding",
      rider_verification_high_risk: "Rider Verification - High Risk",
      restaurant_partner_onboarding: "Restaurant Partner Onboarding",
    };
    return map[workflowId] || workflowId;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </select>
        <button className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-semibold text-slate-900">
              PENDING ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
            {pendingRequests.map(req => (
              <div key={req.requestId} className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">{req.userEmail}</h3>
                    <p className="text-sm text-slate-600">{formatWorkflowName(req.workflow || 'driver_onboarding')}</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                    PENDING
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                      WORKFLOW
                    </p>
                    <p className="text-sm text-slate-700">{formatWorkflowName(req.workflow || 'driver_onboarding')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                      TRIGGERED BY
                    </p>
                    <p className="text-sm text-slate-700">API Integration</p>
                    <p className="text-xs text-slate-500">Workflow-based verification</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                      REQUESTED
                    </p>
                    <p className="text-sm text-slate-700">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    STATUS
                  </p>
                  <p className="text-sm text-slate-700">Waiting for user to complete verification</p>
                </div>

                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
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
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-base font-semibold text-slate-900">
              APPROVED ({approvedRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
            {approvedRequests.map(req => (
              <div key={req.requestId} className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">{req.userEmail}</h3>
                    <p className="text-sm text-slate-600">{formatWorkflowName(req.workflow || 'driver_onboarding')}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                      WORKFLOW
                    </p>
                    <p className="text-sm text-slate-700">{formatWorkflowName(req.workflow || 'driver_onboarding')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                      COMPLETED
                    </p>
                    <p className="text-sm text-slate-700">
                      {req.completedAt ? new Date(req.completedAt).toLocaleString() : new Date(req.createdAt).toLocaleString()}
                    </p>
                    {req.completedAt && req.createdAt && (
                      <p className="text-xs text-slate-500">
                        Duration: {Math.floor((new Date(req.completedAt).getTime() - new Date(req.createdAt).getTime()) / 1000)}s
                      </p>
                    )}
                  </div>
                </div>

                {req.attestation && (
                  <>
                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                        VERIFIED ATTRIBUTES
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {req.requestedAttributes.map((attr, idx) => (
                          <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                            {formatAttributeName(attr)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-semibold text-green-700">
                            Verified via Eigen AVS
                          </span>
                        </div>
                        {req.attestation.eigen?.verificationUrl && (
                          <a 
                            href={req.attestation.eigen.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            View Proof
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      
                      {/* TEE Details */}
                      {req.attestation.tee && (
                        <div className="text-xs text-slate-600 space-y-1 mb-3 pb-3 border-b border-slate-200">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Platform:</span>
                            <span className="font-medium">{req.attestation.tee.platform}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">MRENCLAVE:</span>
                            <span className="font-mono text-xs">{req.attestation.tee.mrenclave?.slice(0, 10)}...{req.attestation.tee.mrenclave?.slice(-8)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">TCB Status:</span>
                            <span className="font-medium text-green-600">{req.attestation.tee.tcbStatus}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Attributes */}
                      <pre className="text-xs font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {JSON.stringify(req.attestation.attributes, null, 2)}
                      </pre>
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(req.attestation, null, 2),
                        `attestation-${req.requestId}`
                      )
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Copy size={14} />
                    Copy Full Attestation
                  </button>
                  <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                    Download JSON
                  </button>
                  <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Denied Requests */}
      {deniedRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-semibold text-slate-900">
              DENIED ({deniedRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
            {deniedRequests.map(req => (
              <div key={req.requestId} className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">{req.userEmail}</h3>
                    <p className="text-sm text-slate-600">{formatWorkflowName(req.workflow || 'driver_onboarding')}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                    DENIED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                      WORKFLOW
                    </p>
                    <p className="text-sm text-slate-700">{formatWorkflowName(req.workflow || 'driver_onboarding')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                      DENIED
                    </p>
                    <p className="text-sm text-slate-700">
                      {req.completedAt ? new Date(req.completedAt).toLocaleString() : new Date(req.createdAt).toLocaleString()}
                    </p>
                    {req.completedAt && req.createdAt && (
                      <p className="text-xs text-slate-500">
                        Duration: {Math.floor((new Date(req.completedAt).getTime() - new Date(req.createdAt).getTime()) / 1000)}s
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    REASON
                  </p>
                  <p className="text-sm text-slate-700">User declined to share requested information</p>
                </div>

                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Retry Verification
                  </button>
                  <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredRequests.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-sm">No verifications found</p>
          <p className="text-slate-500 text-xs mt-1">Verifications will appear here when triggered by your application</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3: WORKFLOWS
// ═══════════════════════════════════════════════════════════════════

function WorkflowsTab({ 
  workflows, 
  showCreateWorkflow, 
  setShowCreateWorkflow 
}: { 
  workflows: Workflow[]; 
  showCreateWorkflow: boolean; 
  setShowCreateWorkflow: (show: boolean) => void;
}) {
  const formatAttributeName = (attr: string) => {
    const map: Record<string, string> = {
      ageOver21: "Age over 21",
      name: "Full name",
      dateOfBirth: "Date of birth",
      nationality: "Nationality",
      notExpired: "Document not expired",
      documentType: "Document type",
    };
    return map[attr] || attr;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Verification Workflows
          </h1>
          <p className="text-sm text-slate-600">
            Configure workflows that can be triggered via API
          </p>
        </div>
        <button
          onClick={() => setShowCreateWorkflow(true)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Create Workflow
        </button>
      </div>

      {/* Workflow Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {workflows.map(workflow => (
          <div key={workflow.id} className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {workflow.name}
              </h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                workflow.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {workflow.status.toUpperCase()}
              </span>
            </div>

            <p className="text-sm text-slate-600 mb-4">{workflow.description}</p>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  WORKFLOW ID
                </p>
                <code className="text-xs font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded">
                  {workflow.workflowId}
                </code>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  USAGE STATISTICS
                </p>
                <p className="text-sm text-slate-700">
                  {workflow.monthlyUsage.toLocaleString()} verifications this month
                </p>
                <p className="text-xs text-slate-600">
                  {workflow.approvalRate}% approval rate · Avg {workflow.avgCompletionTime}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  REQUIRED VERIFICATION
                </p>
                <div className="space-y-1">
                  {workflow.requiredAttributes.map((attr, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-slate-400 rounded-full" />
                      <span className="text-xs text-slate-700">{formatAttributeName(attr)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  COMPLIANCE
                </p>
                <p className="text-xs text-slate-600">{workflow.complianceNote}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <a 
                href="/integration"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors text-center"
              >
                View API Docs
              </a>
              <button className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                Edit Workflow
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Workflow Modal */}
      {showCreateWorkflow && (
        <CreateWorkflowModal onClose={() => setShowCreateWorkflow(false)} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CREATE WORKFLOW MODAL
// ═══════════════════════════════════════════════════════════════════

function CreateWorkflowModal({ onClose }: { onClose: () => void }) {
  const [workflowName, setWorkflowName] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);

  const toggleAttribute = (attr: string) => {
    if (selectedAttributes.includes(attr)) {
      setSelectedAttributes(selectedAttributes.filter(a => a !== attr));
    } else {
      setSelectedAttributes([...selectedAttributes, attr]);
    }
  };

  const handleCreate = () => {
    // TODO: Call backend API to create workflow
    alert(`Workflow created!\n\nTo use this workflow, call:\nPOST /api/v1/verify\n{\n  workflow: "${workflowId}",\n  userId: "user_123",\n  email: "user@example.com"\n}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Create Custom Workflow</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-700 uppercase tracking-wide mb-2">
              WORKFLOW NAME *
            </label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Custom Delivery Partner Verification"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 uppercase tracking-wide mb-2">
              WORKFLOW ID *
            </label>
            <input
              type="text"
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              placeholder="custom_delivery_partner"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              Used in API calls: POST /api/v1/verify &#123; workflow: "..." &#125;
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 uppercase tracking-wide mb-2">
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Verify delivery partner identity for food delivery"
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <label className="block text-xs font-medium text-slate-700 uppercase tracking-wide mb-3">
              REQUIRED ATTRIBUTES
            </label>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Identity Verification</p>
                <div className="space-y-2">
                  {['ageOver21', 'name', 'dateOfBirth', 'nationality'].map(attr => (
                    <label key={attr} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAttributes.includes(attr)}
                        onChange={() => toggleAttribute(attr)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">
                        {attr === 'ageOver21' ? 'Age over 21' :
                         attr === 'name' ? 'Full name' :
                         attr === 'dateOfBirth' ? 'Date of birth' :
                         'Nationality'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Document Verification</p>
                <div className="space-y-2">
                  {['notExpired', 'documentType'].map(attr => (
                    <label key={attr} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAttributes.includes(attr)}
                        onChange={() => toggleAttribute(attr)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">
                        {attr === 'notExpired' ? 'Document not expired' : 'Document type'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!workflowName || !workflowId || selectedAttributes.length === 0}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

