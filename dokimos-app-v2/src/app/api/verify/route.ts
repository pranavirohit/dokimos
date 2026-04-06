import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import axios from "axios";
import { authOptions } from "@/lib/authOptions";
import { logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

function writeVerifyDebugLog(entry: Record<string, unknown>) {
  try {
    const line =
      JSON.stringify({
        sessionId: "f3d078",
        runId: "verify-debug",
        ...entry,
        timestamp: Date.now(),
      }) + "\n";
    fs.appendFileSync(path.join(process.cwd(), "..", "debug-f3d078.log"), line);
  } catch {
    /* ignore */
  }
}

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

    // Return attestation data to frontend
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    logApiError("TEE verification failed", error);

    let teeStatus: number | undefined;
    let teeBodySnippet: string | undefined;
    let axiosCode: string | undefined;
    if (axios.isAxiosError(error)) {
      teeStatus = error.response?.status;
      axiosCode = error.code;
      const d = error.response?.data;
      teeBodySnippet =
        typeof d === "string"
          ? d.slice(0, 200)
          : d && typeof d === "object"
            ? JSON.stringify(d).slice(0, 300)
            : undefined;
    }
    const teeHost = (() => {
      try {
        return new URL(getTeeEndpoint()).host;
      } catch {
        return "invalid";
      }
    })();
    // #region agent log
    writeVerifyDebugLog({
      hypothesisId: "H1",
      location: "api/verify/route.ts:catch",
      message: "next_proxy_tee_error",
      data: { teeHost, teeStatus, axiosCode, teeBodySnippet },
    });
    fetch("http://127.0.0.1:7846/ingest/71e5ebad-69dd-4631-8d24-5ca4e2bf8283", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "f3d078",
      },
      body: JSON.stringify({
        sessionId: "f3d078",
        runId: "verify-debug",
        hypothesisId: "H1",
        location: "api/verify/route.ts",
        message: "axios_tee_failed",
        data: { teeHost, teeStatus, axiosCode },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
