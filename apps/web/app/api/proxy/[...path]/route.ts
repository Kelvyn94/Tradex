import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";

const EXPRESS_API_URL = process.env.EXPRESS_API_URL ?? "http://localhost:5000/api";

const BODYLESS_METHODS = new Set(["GET", "HEAD"]);

/**
 * Catch-all authenticated proxy from the browser to the Express API.
 * Client Components call `/api/proxy/<express-path>` (same-origin, cookie
 * carried automatically) instead of Express directly — the session token
 * is read from the HttpOnly cookie here, on the server, and never reaches
 * client-side JavaScript.
 */
async function forward(request: Request, { params }: { params: { path: string[] } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const search = new URL(request.url).search;
  const upstreamUrl = `${EXPRESS_API_URL}/${params.path.join("/")}${search}`;

  const headers = new Headers();
  headers.set("Content-Type", request.headers.get("Content-Type") ?? "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: BODYLESS_METHODS.has(request.method) ? undefined : await request.text(),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to reach the API service" },
      { status: 502 },
    );
  }

  const responseBody = await upstream.text();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export { forward as GET, forward as POST, forward as PUT, forward as DELETE, forward as PATCH };
