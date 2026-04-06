"use client";

import { useState } from "react";
import axios from "axios";
import { Send } from "lucide-react";
import { dokimosCardClass, dokimosPrimaryButtonClass } from "@/lib/dokimosLayout";
import { DEMO_CONSUMER_ACCOUNTS } from "@/lib/demoConsumerAccounts";
import type { VerificationRequest } from "@/types/dokimos";

const VERIFIER_ID = "airbnb_prod";

const WORKFLOW_ATTRIBUTES: Record<
  "host_verification" | "guest_verification",
  string[]
> = {
  host_verification: ["name", "ageOver18", "address", "notExpired"],
  guest_verification: ["name", "ageOver18", "notExpired"],
};

type VerifierLiveRequestPanelProps = {
  onRequestCreated: (req: VerificationRequest) => void;
};

export function VerifierLiveRequestPanel({ onRequestCreated }: VerifierLiveRequestPanelProps) {
  const [userEmail, setUserEmail] = useState<string>(DEMO_CONSUMER_ACCOUNTS[0].email);
  const [workflow, setWorkflow] = useState<"host_verification" | "guest_verification">(
    "host_verification"
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const { data } = await axios.post<VerificationRequest>("/api/request-verification", {
        verifierId: VERIFIER_ID,
        userEmail,
        requestedAttributes: WORKFLOW_ATTRIBUTES[workflow],
        workflow,
      });
      onRequestCreated(data);
      setMessage(
        `Request ${data.requestId} created for ${userEmail}. The user will see it in Pending (polls every ~10s).`
      );
    } catch (e: unknown) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error
          ? String(e.response.data.error)
          : "Request failed. Is Fastify (TEE) running on TEE_ENDPOINT?";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${dokimosCardClass} space-y-4`}>
      <div>
        <h2 className="text-base font-semibold text-slate-900">Send verification request (live API)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Calls <code className="rounded bg-slate-100 px-1 text-[13px]">POST /api/request-verification</code> via
          Next → Fastify. Requires the target user to exist in TEE (demo accounts below use password{" "}
          <code className="rounded bg-slate-100 px-1">demo1234</code>).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Target user</span>
          <select
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {DEMO_CONSUMER_ACCOUNTS.map((a) => (
              <option key={a.email} value={a.email}>
                {a.name} ({a.email})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Workflow</span>
          <select
            value={workflow}
            onChange={(e) =>
              setWorkflow(e.target.value as "host_verification" | "guest_verification")
            }
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="host_verification">Host verification</option>
            <option value="guest_verification">Guest identity check</option>
          </select>
        </label>
      </div>

      <p className="text-xs text-slate-500">
        Attributes: {WORKFLOW_ATTRIBUTES[workflow].join(", ")}
      </p>

      <button
        type="button"
        onClick={() => void send()}
        disabled={loading}
        className={`${dokimosPrimaryButtonClass} inline-flex items-center gap-2 disabled:opacity-60`}
      >
        <Send className="h-4 w-4" aria-hidden />
        {loading ? "Sending…" : "Send request"}
      </button>

      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
