import "server-only";
import { AUTH, appUrl } from "./config";
import { loginCodeContent, welcomeContent } from "./email-content";
import type { Mail } from "./mailer";

// The wording and design live in email-content.ts (shared with the MailerSend export).
// This file only fills in the real values.

/** The one-time sign-in code. */
export function loginCodeEmail(to: string, code: string): Mail {
  return { to, ...loginCodeContent({ code, minutes: AUTH.codeTtlMinutes }) };
}

/** Sent once, when registration is completed, to confirm the account exists. */
export function welcomeEmail(user: { email: string; name: string; university: string }): Mail {
  return { to: user.email, ...welcomeContent({ ...user, appUrl: appUrl() }) };
}
