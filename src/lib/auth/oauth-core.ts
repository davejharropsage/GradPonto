import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// No "server-only" guard here (same reasoning as lib/auth/password.ts): this module is pure
// crypto with every secret passed in, so tests/oauth.test.ts can import it through the plain
// node:test runner. The env-reading, network-calling half lives in lib/auth/oauth.ts.

export type OAuthProviderId = "google" | "microsoft";

export interface OAuthProviderEndpoints {
  authorizeUrl: string;
  tokenUrl: string;
  /** Checked against the id_token's `iss`. A function because Microsoft's varies by tenant. */
  issuerOk: (iss: string, claims: Record<string, unknown>) => boolean;
}

export const OAUTH_ENDPOINTS: Record<OAuthProviderId, OAuthProviderEndpoints> = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    issuerOk: (iss) => iss === "https://accounts.google.com" || iss === "accounts.google.com",
  },
  microsoft: {
    // "common" accepts both personal Microsoft accounts and work/school (Entra ID) accounts.
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    // Every tenant has its own issuer, so with "common" the only sound check is that it names
    // the same tenant the token itself claims to come from.
    issuerOk: (iss, claims) =>
      typeof claims.tid === "string" && iss === `https://login.microsoftonline.com/${claims.tid}/v2.0`,
  },
};

export function isOAuthProviderId(value: string): value is OAuthProviderId {
  return value === "google" || value === "microsoft";
}

/** A random URL-safe string: used for `state`, `nonce` and the PKCE verifier. */
export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

/** PKCE (RFC 7636) S256 challenge for a verifier. */
export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** Constant-time string comparison that doesn't throw on different lengths. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// --- Signed cookie values ------------------------------------------------------------------------

/**
 * `payload` as base64url JSON plus an HMAC, so a cookie can carry data the browser can read
 * back to us but not alter. Expiry is inside the signed part.
 */
export function signValue(payload: object, secret: string, ttlSeconds: number, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: now + ttlSeconds * 1000 })).toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

/** The payload of a value made by signValue, or null if it was tampered with or has expired. */
export function readSignedValue<T>(value: string | undefined, secret: string, now = Date.now()): T | null {
  if (!value) return null;
  const [body, mac] = value.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (!safeEqual(mac, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & { exp?: number };
    if (typeof parsed.exp !== "number" || parsed.exp <= now) return null;
    return parsed;
  } catch {
    return null;
  }
}

// --- id_token ------------------------------------------------------------------------------------

export interface OAuthProfile {
  /** The provider's stable id for this person. */
  sub: string;
  /** Lower-cased. Not trusted on its own: it's confirmed with an emailed code before first use. */
  email: string;
  name: string | null;
}

/**
 * Reads the person out of an id_token and checks it was issued to us, by this provider, for
 * this sign-in attempt, and hasn't expired.
 *
 * The signature isn't checked: the token comes straight from the provider's token endpoint over
 * TLS in exchange for our client secret, which OpenID Connect Core §3.1.3.7 accepts in place of
 * signature validation. Never use this on an id_token that arrived any other way (e.g. from the
 * browser).
 */
export function profileFromIdToken(
  idToken: string,
  provider: OAuthProviderId,
  expected: { clientId: string; nonce: string },
  now = Date.now()
): OAuthProfile | null {
  const part = idToken.split(".")[1];
  if (!part) return null;
  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  const aud = claims.aud;
  const audOk = Array.isArray(aud) ? aud.includes(expected.clientId) : aud === expected.clientId;
  if (!audOk) return null;
  if (typeof claims.iss !== "string" || !OAUTH_ENDPOINTS[provider].issuerOk(claims.iss, claims)) return null;
  if (typeof claims.exp !== "number" || claims.exp * 1000 <= now) return null;
  if (typeof claims.nonce !== "string" || !safeEqual(claims.nonce, expected.nonce)) return null;
  if (typeof claims.sub !== "string" || !claims.sub) return null;

  // Google says outright whether it has verified the address; if it says no, don't use it.
  if (provider === "google" && claims.email_verified !== true) return null;

  // Microsoft only sends `email` when the account has one set; `preferred_username` is usually
  // the sign-in address. Either way the emailed code is what actually proves it.
  const rawEmail =
    typeof claims.email === "string" && claims.email
      ? claims.email
      : typeof claims.preferred_username === "string"
        ? claims.preferred_username
        : "";
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return null;

  const name = typeof claims.name === "string" && claims.name.trim() ? claims.name.trim().slice(0, 80) : null;
  return { sub: claims.sub, email, name };
}
