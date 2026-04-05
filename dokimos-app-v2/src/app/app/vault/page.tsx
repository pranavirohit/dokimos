"use client";

import { useEffect, useState } from "react";
import { useDokimosApp } from "@/contexts/DokimosAppContext";
import { Screen03Vault } from "@/components/DokimosFlow";
import { ExplainerModal } from "@/components/dokimos/ExplainerModal";
import {
  STORAGE_EXPLAINER_SEEN,
  STORAGE_ONBOARDING_COMPLETE,
} from "@/types/dokimos";

export default function VaultPage() {
  const { attestationData } = useDokimosApp();
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    try {
      const hasSeenExplainer = localStorage.getItem(STORAGE_EXPLAINER_SEEN) === "1";
      const onboardingDone =
        localStorage.getItem(STORAGE_ONBOARDING_COMPLETE) === "1";
      if (!hasSeenExplainer && onboardingDone) {
        setShowExplainer(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <>
      <ExplainerModal
        isOpen={showExplainer}
        onClose={() => setShowExplainer(false)}
      />
      <Screen03Vault showHeaderBack={false} attestationData={attestationData} />
    </>
  );
}
