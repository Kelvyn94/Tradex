import { NextResponse } from "next/server";
import { SESSION_COOKIE, cookieOptions } from "@/lib/session";

const EXPRESS_API_URL = process.env.EXPRESS_API_URL ?? "http://localhost:5000/api";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  if (!body.username || !body.password) {
    return NextResponse.json(
      { success: false, error: "Username and password are required" },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${EXPRESS_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: body.username, password: body.password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to reach the authentication service" },
      { status: 502 },
    );
  }

  const data = await upstream.json();

  if (!upstream.ok || !data.token) {
    return NextResponse.json(
      { success: false, error: data.error ?? "Login failed" },
      { status: upstream.status || 401 },
    );
  }

  // The raw JWT is consumed here and never forwarded to the client body —
  // it only ever leaves this handler inside the HttpOnly cookie below.
  const response = NextResponse.json({ success: true, user: data.user });
  response.cookies.set(SESSION_COOKIE, data.token, cookieOptions);
  return response;
}
