import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Pages reachable without a session. Everything else behind the matcher
// below is treated as protected.
const AUTH_PAGES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const { pathname } = request.nextUrl;
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );

  if (!session && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      // Token was present but invalid/expired — clear it so the browser
      // doesn't keep resending a dead cookie on every request.
      response.cookies.delete(SESSION_COOKIE);
    }
    return response;
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip static assets, image optimization, favicon, and the auth API
  // routes themselves (they must be reachable before a session exists).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
