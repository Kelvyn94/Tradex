import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session";

const EXPRESS_API_URL = process.env.EXPRESS_API_URL ?? "http://localhost:5000/api";

export class UnauthenticatedError extends Error {
  constructor() {
    super("UNAUTHENTICATED");
    this.name = "UnauthenticatedError";
  }
}

/**
 * Server-only fetcher for use in Server Components and Route Handlers.
 * Reads the HttpOnly session cookie via next/headers, translates it into
 * the Authorization: Bearer header the Express backend's auth middleware
 * already expects, and calls Express directly — no round trip through the
 * browser, no client-side loading state for data that can be rendered on
 * the server.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = cookies().get(SESSION_COOKIE)?.value;

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${EXPRESS_API_URL}${path}`, {
    ...init,
    headers,
    // Trading/account data must never be served from Next.js's fetch cache.
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new UnauthenticatedError();
  }

  return response;
}

/**
 * Convenience wrapper around apiFetch that also parses the JSON body.
 */
export async function apiFetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorBody.error ?? `Request to ${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}
