"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AUTH, cookiesAreSecure } from "@/lib/auth/config";
import {
  completeRegistration,
  upsertPendingSignup,
  markEmailVerified,
  findUserForSignIn,
  recordSignIn,
} from "@/lib/auth/account";
import { issueLoginCode, verifyLoginCode } from "@/lib/auth/codes";
import { createSession, destroySession } from "@/lib/auth/session";
import { requireUser } from "@/lib/auth/user";
import { sendMail } from "@/lib/auth/mailer";
import { verifyEmailCodeEmail, welcomeEmail } from "@/lib/auth/email-templates";
import { isRateLimited, isRateLimitedKey } from "@/lib/auth/rate-limit";
import { hashPassword, verifyPassword, passwordSchema } from "@/lib/auth/password";

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

// --- Sign in with a password ---------------------------------------------------------------------

const signInSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.") });

const SIGNIN_ATTEMPTS_PER_EMAIL = 10;
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const INCORRECT_CREDENTIALS: AuthFormState = { error: "Incorrect email or password." };

/**
 * Checks the password against the stored hash, never reveals which part (email or password) was
 * wrong on failure. Unlike a guessable 6-digit code, a password doesn't expire or lock itself, so
 * this is the one new brute-force surface passwords introduce — hence the per-email limiter here,
 * on top of the existing per-IP flood guard shared with every auth action.
 */
export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return INCORRECT_CREDENTIALS;
  const { email, password } = parsed.data;

  if (await isRateLimited("signin", REQUESTS_PER_IP, TEN_MINUTES)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }
  if (isRateLimitedKey(`signin:${email}`, SIGNIN_ATTEMPTS_PER_EMAIL, FIFTEEN_MINUTES)) {
    return { error: "Too many attempts on this account. Please wait 15 minutes and try again." };
  }

  const user = await findUserForSignIn(email);
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return INCORRECT_CREDENTIALS;
  }

  // A password was set and matched, but the email was never confirmed (an abandoned signup they're
  // now returning to finish) — pick up the verification step again rather than a dead-end error.
  if (!user.emailVerifiedAt) {
    const issued = await issueLoginCode(email, "SIGNUP");
    if (issued.ok) {
      try {
        await sendMail(verifyEmailCodeEmail(email, issued.code));
      } catch (error) {
        console.error("Could not send verification email:", error);
        return { error: "We couldn't send the email just now. Please try again in a moment." };
      }
    } else if (issued.reason === "hourly-limit") {
      return { error: "Too many codes have been requested for this address. Please try again later." };
    }
    await rememberEmail(email);
    redirect("/signup/verify");
  }

  if (user.suspendedAt) {
    return { error: "Your account has been suspended. Contact support if you think this is a mistake." };
  }

  await recordSignIn(user.id);
  await createSession(user.id);
  redirect(user.registeredAt ? "/" : "/welcome");
}

// --- Sign up with a password -------------------------------------------------------------------

const signUpSchema = z
  .object({ email: emailSchema, password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Those passwords don't match.",
    path: ["confirmPassword"],
  });

/** Step 1: email + password. Creates the account (unverified) and sends a verification code. */
export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  const { email, password } = parsed.data;

  if (await isRateLimited("signup", REQUESTS_PER_IP, TEN_MINUTES)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const user = await upsertPendingSignup(email, hashPassword(password));
  if (!user) {
    return { error: "That email already has an account. Try signing in, or use “Forgot password?” instead." };
  }

  const issued = await issueLoginCode(email, "SIGNUP");
  if (issued.ok) {
    try {
      await sendMail(verifyEmailCodeEmail(email, issued.code));
    } catch (error) {
      console.error("Could not send verification email:", error);
      return { error: "We couldn't send the email just now. Please try again in a moment." };
    }
  } else if (issued.reason === "hourly-limit") {
    return { error: "Too many codes have been requested for this address. Please try again later." };
  }
  // "cooldown": a code was sent moments ago and is still valid, so just carry on.

  await rememberEmail(email);
  redirect("/signup/verify");
}

/** Step 2: the verification code. On success the account is verified and signed in. */
export async function verifySignupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = await pendingEmail();
  if (!email) redirect("/signup");

  if (await isRateLimited("verify-signup", VERIFIES_PER_IP, TEN_MINUTES)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const result = await verifyLoginCode(email, String(formData.get("code") ?? ""), "SIGNUP");
  if (!result.ok) {
    const messages = {
      invalid: "That code isn't right. Check it and try again.",
      expired: "That code has expired. Send yourself a new one.",
      locked: "Too many wrong attempts on that code. Send yourself a new one.",
      none: "Send yourself a new code to continue.",
    } as const;
    return { error: messages[result.reason] };
  }

  const user = await markEmailVerified(email);
  await createSession(user.id);
  (await cookies()).delete(AUTH.emailCookie);

  redirect(user.registeredAt ? "/" : "/welcome");
}

/** "Send a new code" on the signup verify step. */
export async function resendSignupCodeAction(): Promise<AuthFormState> {
  const email = await pendingEmail();
  if (!email) redirect("/signup");

  if (await isRateLimited("signup", REQUESTS_PER_IP, TEN_MINUTES)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const issued = await issueLoginCode(email, "SIGNUP");
  if (!issued.ok) {
    return issued.reason === "cooldown"
      ? { error: `Please wait ${issued.retryAfterSeconds} seconds before asking for another code.` }
      : { error: "Too many codes have been requested for this address. Please try again later." };
  }

  try {
    await sendMail(verifyEmailCodeEmail(email, issued.code));
  } catch (error) {
    console.error("Could not send verification email:", error);
    return { error: "We couldn't send the email just now. Please try again in a moment." };
  }
  return { notice: "We've sent you a new code." };
}

/** "Use a different email" on the signup verify step. */
export async function changeSignupEmailAction() {
  (await cookies()).delete(AUTH.emailCookie);
  redirect("/signup");
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
