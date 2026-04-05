import { DEFAULT_EIGEN_APP_ID } from "@/lib/eigenConstants";

const VERIFY_BASE = "https://verify-sepolia.eigencloud.xyz/app";

/** EigenCompute “verify app” dashboard (Sepolia). Override full URL via env for a different deployment. */
export function getEigenVerificationDashboardUrl(appId?: string): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_EIGEN_VERIFICATION_URL
      : undefined;
  if (fromEnv?.startsWith("http")) return fromEnv;
  const id = appId ?? DEFAULT_EIGEN_APP_ID;
  return `${VERIFY_BASE}/${id}`;
}
