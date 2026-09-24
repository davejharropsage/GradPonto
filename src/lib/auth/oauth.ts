import "server-only";
import { appUrl, authSecret } from "./config";
import {
  OAUTH_ENDPOINTS,
  pkceChallenge,
  profileFromIdToken,
  readSignedValue,
  signValue,
  type OAuthProfile,
  type OAuthProviderId,
} from "./oauth-core";

/**
 * "Continue with Google / Microsoft". Hand-rolled authorization-code flow with PKCE, state and
 * nonce, in keeping with the rest of lib/auth (no auth library). The pieces:
 *
 *   /api/auth/oauth/[provider]           → sends the browser to the provider (start/route.ts)
 *   /api/auth/oauth/[provider]/callback  → back from the provider (callback/route.ts):
 *       - a provider account we've linked before → signed straight in, no code
 *       - otherwise → a signup code is emailed and they finish on /signup/verify, where
 *         verifySignupAction creates (or verifies) the account and links the provider account.
 *
 * Apple is shown as "Soon" (it needs a paid Apple Developer membership).
 */

export const OAUTH_COOKIES = {
  /** state + nonce + PKCE verifier, between leaving for the provider and coming back. */
  flow: "gp_oauth_flow",
  /** The provider account waiting for its email to be confirmed with a code. Signed. */
  pending: "gp_oauth_pending",
} as const;

export const OAUTH_FLOW_MINUTES = 10;

const CREDENTIAL_ENV: Record<OAuthProviderId, { id: string; secret: string }> = {
  google: { id: "GOOGLE_CLIENT_ID", secret: "GOOGLE_CLIENT_SECRET" },
  microsoft: { id: "MICROSOFT_CLIENT_ID", secret: "MICROSOFT_CLIENT_SECRET" },
};

function credentials(provider: OAuthProviderId) {
  const env = CREDENTIAL_ENV[provider];
  const clientId = process.env[env.id]?.trim();
  const clientSecret = process.env[env.secret]?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/** True once both keys for this provider are set, so its button can be switched on. */
export function oauthEnabled(provider: OAuthProviderId): boolean {
  return credentials(provider) !== null;
}

export function redirectUri(provider: OAuthProviderId): string {
  return `${appUrl()}/api/auth/oauth/${provider}/callback`;
}

export interface OAuthFlow {
  provider: OAuthProviderId;
  state: string;
  nonce: string;
  verifier: string;
}

export interface PendingOAuthLink {
  provider: OAuthProviderId;
  sub: string;
  email: string;
}

export function authorizationUrl(flow: OAuthFlow): string | null {
  const creds = credentials(flow.provider);
  if (!creds) return null;
  const url = new URL(OAUTH_ENDPOINTS[flow.provider].authorizeUrl);
  url.search = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: redirectUri(flow.provider),
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: pkceChallenge(flow.verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

/** Swaps the authorization code for tokens (server to server) and reads the person from the id_token. */
export async function exchangeCode(flow: OAuthFlow, code: string): Promise<OAuthProfile | null> {
  const creds = credentials(flow.provider);
  if (!creds) return null;

  const response = await fetch(OAUTH_ENDPOINTS[flow.provider].tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(flow.provider),
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      code_verifier: flow.verifier,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error(`OAuth token exchange with ${flow.provider} failed:`, response.status, await response.text());
    return null;
  }
  const tokens = (await response.json()) as { id_token?: unknown };
  if (typeof tokens.id_token !== "string") return null;

  return profileFromIdToken(tokens.id_token, flow.provider, { clientId: creds.clientId, nonce: flow.nonce });
}

export function signFlow(flow: OAuthFlow): string {
  return signValue(flow, authSecret(), OAUTH_FLOW_MINUTES * 60);
}

export function readFlow(value: string | undefined): OAuthFlow | null {
  return readSignedValue<OAuthFlow>(value, authSecret());
}

export function signPendingLink(link: PendingOAuthLink, ttlSeconds: number): string {
  return signValue(link, authSecret(), ttlSeconds);
}

export function readPendingLink(value: string | undefined): PendingOAuthLink | null {
  return readSignedValue<PendingOAuthLink>(value, authSecret());
}
