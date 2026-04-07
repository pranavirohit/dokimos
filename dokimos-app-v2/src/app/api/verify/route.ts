import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import axios from "axios";
import { authOptions } from "@/lib/authOptions";
import { logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, livePhotoBase64, requestedAttributes } = body;

    // Validate input
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "Invalid image data" },
        { status: 400 }
      );
    }

    // Check base64 size
    if (imageBase64.length > MAX_IMAGE_SIZE * 1.37) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.email ?? undefined;

    const TEE_ENDPOINT = getTeeEndpoint();

    // #region agent log
    fetch("http://127.0.0.1:7846/ingest/71e5ebad-69dd-4631-8d24-5ca4e2bf8283", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c86765" },
      body: JSON.stringify({
        sessionId: "c86765",
        location: "api/verify/route.ts:pre-axios",
        message: "calling TEE /verify",
        data: {
          teeHost: (() => {
            try {
              return new URL(TEE_ENDPOINT).host;
            } catch {
              return "bad-url";
            }
          })(),
          nodeEnv: process.env.NODE_ENV,
          hasTeeEnv: Boolean(process.env.TEE_ENDPOINT?.trim()),
          hasSessionEmail: Boolean(userId),
          approxPayloadChars:
            imageBase64.length +
            (typeof livePhotoBase64 === "string" ? livePhotoBase64.length : 0),
        },
        timestamp: Date.now(),
        hypothesisId: "H4",
        runId: "tee-debug-1",
      }),
    }).catch(() => {});
    // #endregion

    // Call TEE service
    const response = await axios.post(
      `${TEE_ENDPOINT}/verify`,
      {
        imageBase64,
        ...(typeof livePhotoBase64 === "string" && livePhotoBase64.length > 0
          ? { livePhotoBase64 }
          : {}),
        requestedAttributes: requestedAttributes || [],
        ...(userId ? { userId } : {}),
      },
      {
        timeout: 120000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // #region agent log
    fetch("http://127.0.0.1:7846/ingest/71e5ebad-69dd-4631-8d24-5ca4e2bf8283", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c86765" },
      body: JSON.stringify({
        sessionId: "c86765",
        location: "api/verify/route.ts:axios-ok",
        message: "TEE responded OK",
        data: { upstreamStatus: response.status },
        timestamp: Date.now(),
        hypothesisId: "H2",
        runId: "tee-debug-1",
      }),
    }).catch(() => {});
    // #endregion

    // Return attestation data to frontend
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    logApiError("TEE verification failed", error);

    // #region agent log
    if (axios.isAxiosError(error)) {
      const e = error;
      const body = e.response?.data;
      const errStr =
        body && typeof body === "object" && "error" in body
          ? String((body as { error?: unknown }).error).slice(0, 160)
          : null;
      fetch("http://127.0.0.1:7846/ingest/71e5ebad-69dd-4631-8d24-5ca4e2bf8283", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c86765" },
        body: JSON.stringify({
          sessionId: "c86765",
          location: "api/verify/route.ts:catch",
          message: "verify proxy error",
          data: {
            axiosCode: e.code ?? null,
            responseStatus: e.response?.status ?? null,
            responseErrorSnippet: errStr,
            hasResponse: Boolean(e.response),
          },
          timestamp: Date.now(),
          hypothesisId: "H1",
          runId: "tee-debug-1",
        }),
      }).catch(() => {});
    } else {
      fetch("http://127.0.0.1:7846/ingest/71e5ebad-69dd-4631-8d24-5ca4e2bf8283", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c86765" },
        body: JSON.stringify({
          sessionId: "c86765",
          location: "api/verify/route.ts:catch-nonaxios",
          message: "verify non-axios error",
          data: {
            name: error instanceof Error ? error.name : "unknown",
          },
          timestamp: Date.now(),
          hypothesisId: "H3",
          runId: "tee-debug-1",
        }),
      }).catch(() => {});
    }
    // #endregion

    if (
      axios.isAxiosError(error) &&
      !error.response &&
      (error.code === "ECONNREFUSED" ||
        error.code === "ETIMEDOUT" ||
        error.code === "ENOTFOUND" ||
        error.code === "ECONNABORTED" ||
        error.code === "ECONNRESET" ||
        error.code === "EPIPE")
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot reach the verification server (connection failed, timed out, or reset). Start the Fastify TEE from the repo root (`npm run dev`, default port 8080) and set `TEE_ENDPOINT=http://localhost:8080` in dokimos-app-v2/.env.local (or unset `TEE_ENDPOINT` in development), then restart Next.js.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
