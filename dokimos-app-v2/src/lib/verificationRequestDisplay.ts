import type { VerificationRequest } from "@/types/dokimos";

const COMPANY_BADGE_COLORS = [
  "#0d9488",
  "#059669",
  "#DC2626",
  "#EA580C",
  "#7C3AED",
  "#0891B2",
  "#DB2777",
] as const;

/** Stable accent for a verifier name — circular “logo” avatar on activity lists. */
export function getCompanyBadgeColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COMPANY_BADGE_COLORS[Math.abs(hash) % COMPANY_BADGE_COLORS.length];
}

/** Human-readable label for a TEE / request attribute key. */
export function formatVerificationAttributeKey(attr: string): string {
  const map: Record<string, string> = {
    ageOver21: "Age Over 21",
    ageOver18: "Age Over 18",
    name: "Full Name",
    fullName: "Full Name",
    dateOfBirth: "Date of Birth",
    nationality: "Nationality",
    notExpired: "Document not expired",
    documentNotExpired: "Document not expired",
    documentType: "Document Type",
    documentExpiryDate: "Document Expiry Date",
    address: "Address",
  };
  return map[attr] || attr;
}

/**
 * For approved rows with attestation, prefer keys present in the proof; else requested attributes.
 */
export function getDisplayedAttributeKeys(request: VerificationRequest): string[] {
  if (
    request.status === "approved" &&
    request.attestation &&
    typeof request.attestation === "object"
  ) {
    const att = request.attestation as { attributes?: Record<string, unknown> };
    if (att.attributes && typeof att.attributes === "object") {
      const keys = Object.keys(att.attributes);
      if (keys.length > 0) return keys;
    }
  }
  return request.requestedAttributes ?? [];
}
