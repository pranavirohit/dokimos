"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_CONSUMER_ACCOUNTS, DEMO_DEFAULT_PASSWORD } from "@/lib/demoConsumerAccounts";
import { dokimosCanvasClass } from "@/lib/dokimosLayout";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app/vault";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(DEMO_DEFAULT_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDemoSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("demo-credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password. Use a demo account and password demo1234.");
        setLoading(false);
        return;
      }
      try {
        localStorage.setItem("dokimos_user", JSON.stringify({ email: email.trim() }));
      } catch {
        /* ignore */
      }
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("Sign-in failed. Is the TEE (Fastify) running?");
      setLoading(false);
    }
  };

  const pickAccount = (em: string) => {
    setEmail(em);
    setPassword(DEMO_DEFAULT_PASSWORD);
  };

  return (
    <div className={`min-h-[100dvh] px-4 py-10 pt-[max(2rem,env(safe-area-inset-top))] ${dokimosCanvasClass}`}>
      <div className="mx-auto w-full max-w-md">
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.12em] text-teal-800/80">
          Dokimos
        </p>
        <h1 className="mt-2 text-center text-2xl font-semibold tracking-tight text-slate-900">Demo sign-in</h1>
        <p className="mt-2 text-center text-[14px] text-slate-600">
          Use a seeded demo account. Password for all: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px]">{DEMO_DEFAULT_PASSWORD}</code>
        </p>

        <form onSubmit={handleDemoSignIn} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[15px] text-slate-900 shadow-sm focus:border-dokimos-accent focus:outline-none focus:ring-2 focus:ring-dokimos-accent/30"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[15px] text-slate-900 shadow-sm focus:border-dokimos-accent focus:outline-none focus:ring-2 focus:ring-dokimos-accent/30"
              required
            />
          </div>
          {error ? (
            <p className="text-[13px] text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-dokimos-accent py-3 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-dokimos-accentHover disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Quick pick</p>
          <ul className="mt-2 space-y-2">
            {DEMO_CONSUMER_ACCOUNTS.map((a) => (
              <li key={a.email}>
                <button
                  type="button"
                  onClick={() => pickAccount(a.email)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-[14px] transition-colors hover:border-teal-200 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{a.name}</span>
                  <span className="mt-0.5 block text-[12px] text-slate-500">{a.email}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">{a.note}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-center text-[13px] text-slate-500">Or continue with Google (registers in TEE on first sign-in)</p>
          <button
            type="button"
            onClick={() => void signIn("google", { callbackUrl })}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-3 text-[14px] font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
          >
            Continue with Google
          </button>
        </div>

        <p className="mt-8 text-center text-[13px] text-slate-500">
          <Link href="/" className="text-dokimos-accent hover:underline">
            Back to home
          </Link>
          {" · "}
          <Link href="/onboarding" className="text-dokimos-accent hover:underline">
            Onboarding (new ID)
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-dokimos-productCanvas" aria-hidden />}>
      <LoginForm />
    </Suspense>
  );
}
