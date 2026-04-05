"use client";

import { useRouter } from "next/navigation";
import { useDokimosApp } from "@/contexts/DokimosAppContext";
import { Screen06History } from "@/components/DokimosFlow";

export default function RequestsPage() {
  const router = useRouter();
  const { setSelectedRequest } = useDokimosApp();

  return (
    <Screen06History
      onReviewRequest={(request) => {
        setSelectedRequest(request);
        router.push("/app/requests/review");
      }}
    />
  );
}
