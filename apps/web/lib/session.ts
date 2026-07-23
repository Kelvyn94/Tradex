import { jwtVerify } from "jose";

export const SESSION_COOKIE = "tradex_session";

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days — must match the expiry Express signs the JWT with
};

export interface SessionPayload {
  userId: number;
  iat: number;
  exp: number;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET is not set. Copy apps/web/.env.local.example to apps/web/.env.local " +
        "and set it to the same value as JWT_SECRET in apps/api/.env.",
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verifies the session JWT's signature and expiry. Returns null for any
 * missing, malformed, expired, or tampered token — callers should treat
 * that identically to "no session" rather than distinguishing failure modes.
 */
export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
