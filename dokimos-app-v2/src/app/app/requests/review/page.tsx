"use client";

import { useRouter } from "next/navigation";
import { useDokimosApp } from "@/contexts/DokimosAppContext";
import { Screen04Share, ShareRequestTopBar } from "@/components/DokimosFlow";

export default function RequestReviewPage() {
  const router = useRouter();
  const { selectedRequest, setAttestationData } = useDokimosApp();

  return (
    <div className="relative w-full">
      <ShareRequestTopBar onBack={() => router.push("/app/requests")} />
      <Screen04Share
        onNext={() => router.push("/app/requests/receipt")}
        onAfterDeny={() => router.push("/app/requests")}
        selectedRequest={selectedRequest}
        setAttestationData={setAttestationData}
      />
    </div>
  );
}
