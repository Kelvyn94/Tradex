import { NextResponse } from "next/server";

const EXPRESS_API_URL = process.env.EXPRESS_API_URL ?? "http://localhost:5000/api";

export async function POST(request: Request) {
  let body: { username?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  if (!body.username || !body.email || !body.password) {
    return NextResponse.json(
      { success: false, error: "Username, email, and password are required" },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${EXPRESS_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: body.username,
        email: body.email,
        password: body.password,
      }),
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
    // express-validator failures arrive as { error, details: [...] }
    const detailMessage = Array.isArray(data.details) && data.details.length > 0
      ? data.details[0].msg
      : undefined;
    return NextResponse.json(
      { success: false, error: detailMessage ?? data.error ?? "Registration failed" },
      { status: upstream.status },
    );
  }

  // Registration does not start a session — the user logs in explicitly
  // afterward, matching Express's design (register never double-purposes
  // as login). No token handling needed here at all.
  return NextResponse.json({ success: true });
}
