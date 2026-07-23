import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Pages reachable without a session. Everything else behind the matcher
// below is treated as protected.
const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

// Of those, only these make sense to redirect away from once a session
// exists — there's no reason to show a login/register form to someone
// already signed in. Reset/verify links, though, must keep working even
// when opened by an already-authenticated browser (e.g. a link received
// on another device, or clicked after the user logged back in elsewhere).
const REDIRECT_IF_AUTHENTICATED_PAGES = ["/login", "/register"];

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

  const shouldRedirectAway = REDIRECT_IF_AUTHENTICATED_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );
  if (session && shouldRedirectAway) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip static assets, image optimization, favicon, and the auth API
  // routes themselves (they must be reachable before a session exists).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
