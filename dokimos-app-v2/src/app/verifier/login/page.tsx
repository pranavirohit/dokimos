"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Building2 } from "lucide-react";
import Link from "next/link";

export default function VerifierLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/api/auth/verifier/login", formData);
      
      // Store verifier session in localStorage
      localStorage.setItem("dokimos_verifier", JSON.stringify({
        verifierId: response.data.verifierId,
        companyName: response.data.companyName,
        email: response.data.email,
      }));

      // Redirect to verifier dashboard
      router.push("/verifier/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-dokimos-navy via-[#15245a] to-dokimos-navy p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Building2 className="h-8 w-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-center font-serif text-3xl font-bold tracking-tight text-white">
            Dokimos for Business
          </h1>
        </div>

        {/* Tagline */}
        <p className="mb-8 text-center text-[15px] leading-relaxed text-white/75">
          Verify customer identities with zero-knowledge proofs
        </p>

        {/* Login Form */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5">
          <h2 className="mb-6 text-xl font-bold text-dokimos-navy">Verifier sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/verifier/signup" className="text-indigo-600 font-medium hover:underline">
              Create Account
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Demo account: acme@brokerage.com / demo123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
