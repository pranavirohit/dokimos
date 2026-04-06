/**
 * Resolved base URL for the Fastify / TEE API (verify, auth, requests, etc.).
 *
 * - Override anytime with `TEE_ENDPOINT` in `.env.local`.
 * - **Development** default (unset): `http://localhost:8080` so demo login + `/api/verify` match a local
 *   seeded Fastify (repo root). Production/staging builds use the deployed EigenCloud URL.
 */
const DEFAULT_TEE_PRODUCTION = "http://34.178.21.227:8080";
const DEFAULT_TEE_DEVELOPMENT = "http://localhost:8080";

/** @deprecated Use getTeeEndpoint(); kept for README / docs that reference a single string. */
export const DEFAULT_TEE_ENDPOINT = DEFAULT_TEE_PRODUCTION;

export function getTeeEndpoint(): string {
  const fromEnv = process.env.TEE_ENDPOINT?.trim();
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === "development"
    ? DEFAULT_TEE_DEVELOPMENT
    : DEFAULT_TEE_PRODUCTION;
}
