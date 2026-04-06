import { DokimosPageChrome } from "@/components/dokimos/DokimosPageChrome";
import { VerifierDashboard } from "@/components/verifier/VerifierDashboard";

/** Public business verifier dashboard (demo session + seeded rows). */
export default function BusinessDashboardPage() {
  return (
    <DokimosPageChrome
      role="business"
      title="Verification Dashboard"
      description="Manage identity verification requests and workflows for your organization."
    >
      <VerifierDashboard />
    </DokimosPageChrome>
  );
}
