import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

const COOKIE_NAME = "dokimos_verifier_session";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const TEE_ENDPOINT = process.env.TEE_ENDPOINT || "http://localhost:8080";

  try {
    const response = await axios.get(
      `${TEE_ENDPOINT}/api/auth/verifier/session`,
      {
        timeout: 10000,
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return NextResponse.json(response.data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
