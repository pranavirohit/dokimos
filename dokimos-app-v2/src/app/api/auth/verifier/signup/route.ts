import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { axiosErrorResponse, logApiError } from "@/lib/safeLog";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, email, password } = body;

    if (!companyName || !email || !password) {
      return NextResponse.json(
        { error: "Company name, email, and password are required" },
        { status: 400 }
      );
    }

    const TEE_ENDPOINT = process.env.TEE_ENDPOINT || "http://localhost:8082";

    const response = await axios.post(
      `${TEE_ENDPOINT}/api/auth/verifier/signup`,
      { companyName, email, password },
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    logApiError("Verifier signup failed", error);
    const { message, status } = axiosErrorResponse(
      error,
      "Signup failed. Please try again."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
