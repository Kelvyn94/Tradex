import { NextResponse } from "next/server";

const EXPRESS_API_URL = process.env.EXPRESS_API_URL ?? "http://localhost:5000/api";

export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  if (!body.token) {
    return NextResponse.json(
      { success: false, error: "Verification token is required" },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${EXPRESS_API_URL}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: body.token }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to reach the authentication service" },
      { status: 502 },
    );
  }

  const data = await upstream.json();

  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, error: data.error ?? "Verification failed" },
      { status: upstream.status },
    );
  }

  return NextResponse.json({ success: true, message: data.message });
}
