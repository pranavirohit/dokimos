"use client";

import { useRouter } from "next/navigation";
import { useDokimosApp } from "@/contexts/DokimosAppContext";
import { Screen05Receipt } from "@/components/DokimosFlow";

export default function RequestReceiptPage() {
  const router = useRouter();
  const { attestationData, selectedRequest } = useDokimosApp();

  return (
    <Screen05Receipt
      onNext={() => router.push("/app/vault")}
      onBack={() => router.push("/app/requests")}
      attestationData={attestationData}
      selectedRequest={selectedRequest}
    />
  );
}
