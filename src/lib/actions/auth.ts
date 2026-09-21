"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AUTH, cookiesAreSecure } from "@/lib/auth/config";
import { completeRegistration, upsertVerifiedUser } from "@/lib/auth/account";
import { issueLoginCode, verifyLoginCode } from "@/lib/auth/codes";
import { createSession, destroySession } from "@/lib/auth/session";
import { requireUser } from "@/lib/auth/user";
import { sendMail } from "@/lib/auth/mailer";
import { loginCodeEmail, welcomeEmail } from "@/lib/auth/email-templates";
import { isRateLimited } from "@/lib/auth/rate-limit";

// Server Actions are public HTTP endpoints, so each one re-checks everything itself.
// (Next.js also verifies the request Origin, which protects them against CSRF.)

export type AuthFormState = { error?: string; notice?: string } | undefined;

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80, "That name is too long."),
  university: z.string().trim().min(1, "Enter your university.").max(120, "That name is too long."),
});

const TEN_MINUTES = 10 * 60 * 1000;

// Per-address flood guard only. Deliberately generous: students often share one public IP (campus
// Wi-Fi), so this must not lock out real people. The strict limits (codes per email per hour and
// wrong guesses per code) are per email and live in lib/auth/codes.ts.
const REQUESTS_PER_IP = 30;
const VERIFIES_PER_IP = 60;

async function rememberEmail(email: string) {
  (await cookies()).set(AUTH.emailCookie, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookiesAreSecure(),
    path: "/",
    maxAge: AUTH.emailCookieMinutes * 60,
  });
}

async function pendingEmail(): Promise<string | null> {
  const value = (await cookies()).get(AUTH.emailCookie)?.value;
  const parsed = emailSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Step 1: they typed their email. Send a code and move to the "enter the code" step. */
export async function requestCodeAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };
  const email = parsed.data;

  if (await isRateLimited("request-code", REQUESTS_PER_IP, TEN_MINUTES)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  // The response is the same whether or not this address already has an account, so this
  // form can't be used to find out who is registered.
  const issued = await issueLoginCode(email);

  if (issued.ok) {
    try {
      await sendMail(loginCodeEmail(email, issued.code));
    } catch (error) {
      console.error("Could not send sign-in email:", error);
      return { error: "We couldn't send the email just now. Please try again in a moment." };
    }
  } else if (issued.reason === "hourly-limit") {
    return { error: "Too many codes have been requested for this address. Please try again later." };
  }
  // "cooldown": a code was sent moments ago and is still valid, so just carry on.

  await rememberEmail(email);
  redirect("/signin/verify");
}

/** Step 2: they typed the code. If it's right they're signed in; new people go on to register. */
export async function verifyCodeAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = await pendingEmail();
  if (!email) redirect("/signin");

  if (await isRateLimited("verify-code", VERIFIES_PER_IP, TEN_MINUTES)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const result = await verifyLoginCode(email, String(formData.get("code") ?? ""));
  if (!result.ok) {
    const messages = {
      invalid: "That code isn't right. Check it and try again.",
      expired: "That code has expired. Send yourself a new one.",
      locked: "Too many wrong attempts on that code. Send yourself a new one.",
      none: "Send yourself a new code to continue.",
    } as const;
    return { error: messages[result.reason] };
  }

  // The address is now proven. The account exists from this moment: create it if it's
  // new, or find it if it already does, and sign them straight in.
  const user = await upsertVerifiedUser(email);

  await createSession(user.id);
  (await cookies()).delete(AUTH.emailCookie);

  redirect(user.registeredAt ? "/" : "/welcome");
}

/** "Send a new code" on the verify step. */
export async function resendCodeAction(): Promise<AuthFormState> {
  const email = await pendingEmail();
  if (!email) redirect("/signin");

  if (await isRateLimited("request-code", REQUESTS_PER_IP, TEN_MINUTES)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const issued = await issueLoginCode(email);
  if (!issued.ok) {
    return issued.reason === "cooldown"
      ? { error: `Please wait ${issued.retryAfterSeconds} seconds before asking for another code.` }
      : { error: "Too many codes have been requested for this address. Please try again later." };
  }

  try {
    await sendMail(loginCodeEmail(email, issued.code));
  } catch (error) {
    console.error("Could not send sign-in email:", error);
    return { error: "We couldn't send the email just now. Please try again in a moment." };
  }
  return { notice: "We've sent you a new code." };
}

/** "Use a different email" on the verify step. */
export async function changeEmailAction() {
  (await cookies()).delete(AUTH.emailCookie);
  redirect("/signin");
}

/** Step 3 (new people only): name and university. This completes registration. */
export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await requireUser();
  if (user.registeredAt) redirect("/");

  const parsed = registerSchema.safeParse({ name: formData.get("name"), university: formData.get("university") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };

  // True only for the request that actually completes registration, so a double-click
  // can't send two confirmation emails.
  if (await completeRegistration(user.id, parsed.data)) {
    // The account is created; the confirmation email is best-effort so a mail outage
    // never stops someone getting into the app.
    try {
      await sendMail(welcomeEmail({ email: user.email, ...parsed.data }));
    } catch (error) {
      console.error("Could not send welcome email:", error);
    }
  }

  redirect("/");
}

export async function signOutAction() {
  await destroySession();
  redirect("/landing");
}
