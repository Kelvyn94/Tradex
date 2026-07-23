import { NextResponse } from "next/server";

const EXPRESS_API_URL = process.env.EXPRESS_API_URL ?? "http://localhost:5000/api";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  if (!body.email) {
    return NextResponse.json(
      { success: false, error: "Email is required" },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${EXPRESS_API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email }),
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
    const detailMessage = Array.isArray(data.details) && data.details.length > 0
      ? data.details[0].msg
      : undefined;
    return NextResponse.json(
      { success: false, error: detailMessage ?? data.error ?? "Request failed" },
      { status: upstream.status },
    );
  }

  return NextResponse.json({ success: true, message: data.message });
}
