import "server-only";
import { appUrl, authSecret } from "@/lib/auth/config";
import { OAUTH_ENDPOINTS, pkceChallenge, readSignedValue, signValue } from "@/lib/auth/oauth-core";
import { openSecret, sealSecret } from "@/lib/auth/seal";

/**
 * Talking to Google for "Sync from Gmail": the OAuth connection (its own Google OAuth client, NOT
 * the "Continue with Google" sign-in one — see README's "Sync from Gmail"), and the few Gmail API
 * calls a scan needs. Read-only throughout: gmail.readonly is the only scope ever requested.
 */

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const TOKEN_PURPOSE = "gmail-refresh-token";
const REQUEST_TIMEOUT_MS = 20_000;

export const GMAIL_FLOW_COOKIE = "gp_gmail_flow";
export const GMAIL_FLOW_MINUTES = 10;

function credentials() {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function gmailConfigured(): boolean {
  return credentials() !== null;
}

/**
 * Where Google sends the browser back to. Production uses APP_URL. A Vercel preview deployment
 * uses its stable branch URL instead (VERCEL_BRANCH_URL, e.g. the lucas/dev branch's alias) —
 * unlike sign-in, a Gmail connection has to come back to the deployment that started it, because
 * the flow cookie lives on that host. Google only accepts redirect URIs registered exactly, so
 * each one in use has to be added to the OAuth client (README lists them).
 */
export function gmailRedirectUri(): string {
  const branchUrl = process.env.VERCEL_BRANCH_URL;
  const base = process.env.VERCEL_ENV === "preview" && branchUrl ? `https://${branchUrl}` : appUrl();
  return `${base}/api/gmail/callback`;
}

// --- OAuth ---------------------------------------------------------------------------------------

export interface GmailFlow {
  /** The admin who started it; the callback refuses to finish it for anyone else. */
  userId: string;
  state: string;
  verifier: string;
}

export function signGmailFlow(flow: GmailFlow): string {
  return signValue(flow, authSecret(), GMAIL_FLOW_MINUTES * 60);
}

export function readGmailFlow(value: string | undefined): GmailFlow | null {
  return readSignedValue<GmailFlow>(value, authSecret());
}

export function gmailAuthorizationUrl(flow: GmailFlow, loginHint?: string): string | null {
  const creds = credentials();
  if (!creds) return null;
  const url = new URL(OAUTH_ENDPOINTS.google.authorizeUrl);
  url.search = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: gmailRedirectUri(),
    response_type: "code",
    scope: GMAIL_SCOPE,
    state: flow.state,
    code_challenge: pkceChallenge(flow.verifier),
    code_challenge_method: "S256",
    // offline + consent: always hand back a refresh token, even when reconnecting.
    access_type: "offline",
    prompt: "consent select_account",
    ...(loginHint ? { login_hint: loginHint } : {}),
  }).toString();
  return url.toString();
}

export class GmailAuthError extends Error {
  constructor(message = "Gmail access has expired or was revoked. Reconnect Gmail to keep syncing.") {
    super(message);
    this.name = "GmailAuthError";
  }
}

/** Swaps the authorization code for tokens. Returns null on any failure, including the Gmail box being left unticked. */
export async function exchangeGmailCode(flow: GmailFlow, code: string): Promise<{ refreshToken: string; accessToken: string } | null> {
  const creds = credentials();
  if (!creds) return null;
  const response = await fetch(OAUTH_ENDPOINTS.google.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: gmailRedirectUri(),
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      code_verifier: flow.verifier,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    console.error("Gmail token exchange failed:", response.status, await response.text());
    return null;
  }
  const tokens = (await response.json()) as { refresh_token?: unknown; access_token?: unknown; scope?: unknown };
  // Google's consent screen lets people untick individual scopes; without this one there's nothing to do.
  const scopes = typeof tokens.scope === "string" ? tokens.scope.split(" ") : [];
  if (!scopes.includes(GMAIL_SCOPE)) return null;
  if (typeof tokens.refresh_token !== "string" || typeof tokens.access_token !== "string") return null;
  return { refreshToken: tokens.refresh_token, accessToken: tokens.access_token };
}

/** A fresh access token from the stored (sealed) refresh token. Throws GmailAuthError if Google refuses it. */
export async function accessTokenFor(refreshTokenSealed: string): Promise<string> {
  const creds = credentials();
  if (!creds) throw new Error("Gmail sync isn't set up: GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are missing.");
  const refreshToken = openSecret(refreshTokenSealed, authSecret(), TOKEN_PURPOSE);
  if (!refreshToken) throw new GmailAuthError();

  const response = await fetch(OAUTH_ENDPOINTS.google.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (response.status === 400 || response.status === 401) throw new GmailAuthError();
  if (!response.ok) throw new Error("Google didn't respond. Please try again in a moment.");
  const tokens = (await response.json()) as { access_token?: unknown };
  if (typeof tokens.access_token !== "string") throw new GmailAuthError();
  return tokens.access_token;
}

export function sealRefreshToken(refreshToken: string): string {
  return sealSecret(refreshToken, authSecret(), TOKEN_PURPOSE);
}

/** Best effort: tells Google to forget the grant. Disconnecting goes ahead whatever this returns. */
export async function revokeRefreshToken(refreshTokenSealed: string): Promise<void> {
  const refreshToken = openSecret(refreshTokenSealed, authSecret(), TOKEN_PURPOSE);
  if (!refreshToken) return;
  try {
    await fetch(REVOKE_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: refreshToken }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.error("Could not revoke Gmail token:", error);
  }
}

// --- Gmail API -----------------------------------------------------------------------------------

async function gmailGet<T>(accessToken: string, path: string, params: URLSearchParams = new URLSearchParams()): Promise<T> {
  const query = params.toString();
  const response = await fetch(`${GMAIL_API}${path}${query ? `?${query}` : ""}`, {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (response.status === 401) throw new GmailAuthError();
  if (response.status === 403) {
    // Usually the Gmail API isn't enabled in the Google Cloud project, or a quota was hit.
    console.error("Gmail API refused the request:", await response.text());
    throw new Error("Gmail refused the request. Check the Gmail API is enabled for this Google Cloud project.");
  }
  if (!response.ok) throw new Error(`Gmail didn't respond as expected (${response.status}). Please try again.`);
  return (await response.json()) as T;
}

/** The connected mailbox's own address (needs no scope beyond gmail.readonly). */
export async function gmailProfileEmail(accessToken: string): Promise<string> {
  const profile = await gmailGet<{ emailAddress?: string }>(accessToken, "/profile");
  if (!profile.emailAddress) throw new Error("Gmail didn't say which address this mailbox is.");
  return profile.emailAddress.toLowerCase();
}

/** Ids of messages matching `query`, newest first, up to `limit`. */
export async function listMessageIds(accessToken: string, query: string, limit: number): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ q: query, maxResults: String(Math.min(100, limit - ids.length)) });
    if (pageToken) params.set("pageToken", pageToken);
    const page = await gmailGet<{ messages?: { id: string }[]; nextPageToken?: string }>(accessToken, "/messages", params);
    for (const message of page.messages ?? []) ids.push(message.id);
    pageToken = page.nextPageToken;
  } while (pageToken && ids.length < limit);
  return ids;
}

export interface GmailMessagePart {
  mimeType?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string };
  parts?: GmailMessagePart[];
}

export interface GmailApiMessage {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
}

export const METADATA_HEADERS = ["From", "To", "Cc", "Subject", "Date", "List-Unsubscribe", "List-Id"];

/** Headers and snippet only — enough for the pre-filter, without downloading the body. */
export function getMessageMetadata(accessToken: string, id: string): Promise<GmailApiMessage> {
  const params = new URLSearchParams({ format: "metadata" });
  for (const header of METADATA_HEADERS) params.append("metadataHeaders", header);
  return gmailGet<GmailApiMessage>(accessToken, `/messages/${encodeURIComponent(id)}`, params);
}

export function getFullMessage(accessToken: string, id: string): Promise<GmailApiMessage> {
  return gmailGet<GmailApiMessage>(accessToken, `/messages/${encodeURIComponent(id)}`, new URLSearchParams({ format: "full" }));
}

export function headerValue(message: GmailApiMessage, name: string): string | undefined {
  const lower = name.toLowerCase();
  return message.payload?.headers?.find((header) => header.name.toLowerCase() === lower)?.value;
}
