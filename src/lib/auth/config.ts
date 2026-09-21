import "server-only";
import { SESSION_COOKIE } from "./constants";

/** Tunable limits and names for sign-in. Change them here, nowhere else. */
export const AUTH = {
  sessionCookie: SESSION_COOKIE,
  /** Remembers which address the code was sent to, between the two sign-in steps. */
  emailCookie: "gp_signin_email",
  sessionDays: 30,
  codeLength: 6,
  codeTtlMinutes: 10,
  /** Wrong guesses allowed per code before it is locked. 6 digits = 1,000,000 options. */
  maxAttemptsPerCode: 5,
  resendCooldownSeconds: 30,
  maxCodesPerEmailPerHour: 5,
  emailCookieMinutes: 30,
} as const;

/** Public address of the site, used for links in emails and to decide on the `Secure` cookie flag. */
export function appUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/** Cookies are marked `Secure` whenever the site is served over https. */
export function cookiesAreSecure(): boolean {
  return appUrl().startsWith("https://");
}

/** Secret used to HMAC sign-in codes. Must be long and random; never commit it. */
export function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set it in .env to a random string of at least 32 characters " +
        "(for example: node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\")."
    );
  }
  return secret;
}
