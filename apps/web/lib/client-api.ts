"use client";

/**
 * Browser-side fetcher for Client Components. Calls the same-origin
 * /api/proxy gateway instead of the Express API directly — there is no
 * token to attach here because the browser never holds one; the proxy
 * route reads it from the HttpOnly cookie on the server.
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function clientApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/proxy${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Not authenticated", 401);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(errorBody.error ?? "Request failed", response.status);
  }

  return response.json() as Promise<T>;
}
