"use client";

import { HowDokimosProtectsContent } from "@/components/dokimos/HowDokimosProtectsContent";
import { DokimosPageChrome } from "@/components/dokimos/DokimosPageChrome";

export default function HowItWorksPage() {
  return (
    <DokimosPageChrome
      role="detail"
      roleLabel="Help"
      title="How Dokimos protects you"
      description="A short walkthrough of verification—from upload to sharing proof on your terms."
    >
      <div className="mx-auto max-w-2xl">
        <HowDokimosProtectsContent omitMainHeading showTechnicalDetailsButton />
      </div>
    </DokimosPageChrome>
  );
}
