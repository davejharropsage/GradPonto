import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH, cookiesAreSecure } from "@/lib/auth/config";
import { findUserByOAuthAccount, recordSignIn } from "@/lib/auth/account";
import { issueLoginCode } from "@/lib/auth/codes";
import { sendMail } from "@/lib/auth/mailer";
import { verifyEmailCodeEmail } from "@/lib/auth/email-templates";
import { exchangeCode, OAUTH_COOKIES, readFlow, signPendingLink } from "@/lib/auth/oauth";
import { safeEqual } from "@/lib/auth/oauth-core";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";

/**
 * Back from Google/Microsoft. A provider account linked before signs straight in; a new one gets
 * a signup code emailed to the address the provider reported and finishes on /signup/verify
 * (verifySignupAction links it once the code is right). Errors go back to /signin?oauth=<reason>.
 */
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const query = new URL(request.url).searchParams;
  const store = await cookies();

  const flow = readFlow(store.get(OAUTH_COOKIES.flow)?.value);
  store.delete({ name: OAUTH_COOKIES.flow, path: "/api/auth/oauth" });

  // They pressed Cancel on the provider's screen.
  if (query.get("error")) redirect("/signin?oauth=cancelled");

  const state = query.get("state") ?? "";
  const code = query.get("code") ?? "";
  // No flow cookie (took over 10 minutes, or came here directly) or a state that doesn't match
  // the one we sent (a forged callback): refuse.
  if (!flow || flow.provider !== provider || !code || !safeEqual(state, flow.state)) {
    redirect("/signin?oauth=failed");
  }

  if (await isRateLimited("oauth-callback", 30, 10 * 60 * 1000)) redirect("/signin?oauth=busy");

  const profile = await exchangeCode(flow, code);
  if (!profile) redirect("/signin?oauth=failed");

  // Linked before: the code was already done once, so sign straight in.
  const linked = await findUserByOAuthAccount(flow.provider, profile.sub);
  if (linked) {
    if (linked.suspendedAt) redirect("/signin?suspended=1");
    await recordSignIn(linked.id);
    await createSession(linked.id);
    redirect(linked.registeredAt ? "/" : "/welcome");
  }

  // First time with this provider account: confirm the email with a code before creating or
  // linking anything.
  const issued = await issueLoginCode(profile.email, "SIGNUP");
  if (issued.ok) {
    try {
      await sendMail(verifyEmailCodeEmail(profile.email, issued.code));
    } catch (error) {
      console.error("Could not send verification email:", error);
      redirect("/signin?oauth=email");
    }
  } else if (issued.reason === "hourly-limit") {
    redirect("/signin?oauth=limit");
  }
  // "cooldown": a code was sent moments ago and is still valid, so just carry on.

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookiesAreSecure(),
    path: "/",
    maxAge: AUTH.emailCookieMinutes * 60,
  };
  store.set(AUTH.emailCookie, profile.email, cookieOptions);
  store.set(
    OAUTH_COOKIES.pending,
    signPendingLink({ provider: flow.provider, sub: profile.sub, email: profile.email }, AUTH.emailCookieMinutes * 60),
    cookieOptions
  );
  redirect("/signup/verify");
}
