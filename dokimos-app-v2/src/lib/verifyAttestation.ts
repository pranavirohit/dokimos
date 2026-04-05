import { verifyMessage } from "viem";
import { DEFAULT_EIGEN_APP_ID } from "./eigenConstants";

export { DEFAULT_EIGEN_APP_ID };

export type DokimosAttestationInput = {
  message: string;
  signature: `0x${string}`;
  signer: `0x${string}`;
  tee?: {
    quote?: string;
    mrenclave?: string;
    platform?: string;
  };
  eigen?: {
    appId?: string;
    verificationUrl?: string;
    verified?: boolean;
  };
};

export type VerifyAttestationResult = {
  signatureValid: boolean;
  teeFieldsPresent: boolean;
  eigenMetadataPresent: boolean;
  eigenAppIdMatchesExpected: boolean;
  /**
   * Mock/demo quotes in this repo are not real TDX quotes registered with Eigen AVS.
   * When you run on real EigenCompute hardware, integrate Eigen’s trust / verification docs.
   */
  note: string;
};

/**
 * Verifies what we can verify locally today: EIP-191 signature + expected shape / app id.
 * Full TDX quote verification against Intel + Eigen AVS is out of scope for this helper.
 */
export async function verifyDokimosAttestation(
  attestation: DokimosAttestationInput,
  options?: { expectedEigenAppId?: string }
): Promise<VerifyAttestationResult> {
  const signatureValid = await verifyMessage({
    address: attestation.signer,
    message: attestation.message,
    signature: attestation.signature,
  });

  const t = attestation.tee;
  const teeFieldsPresent = Boolean(
    t?.quote &&
      t.quote.length > 0 &&
      t?.mrenclave &&
      t.mrenclave.length > 0
  );

  const e = attestation.eigen;
  const eigenMetadataPresent = Boolean(
    e?.appId && e?.verificationUrl
  );

  const expected =
    options?.expectedEigenAppId ?? DEFAULT_EIGEN_APP_ID;
  const eigenAppIdMatchesExpected = Boolean(
    e?.appId &&
      e.appId.toLowerCase() === expected.toLowerCase()
  );

  return {
    signatureValid,
    teeFieldsPresent,
    eigenMetadataPresent,
    eigenAppIdMatchesExpected,
    note:
      "Mock TEE quotes in the demo are not verifiable on Eigen AVS. For production, run verification on EigenCompute and follow Eigen docs (Verify trust guarantees).",
  };
}
