import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import axios from "axios";
import { authOptions } from "@/lib/authOptions";
import { logApiError } from "@/lib/safeLog";

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

    // Get TEE endpoint from server-side env (not exposed to frontend)
    const TEE_ENDPOINT = process.env.TEE_ENDPOINT || "http://localhost:8080";

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

    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
