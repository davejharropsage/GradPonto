import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser, destroySession } from "./session";
import { scopedDb } from "./scoped-db";
import { AUTH } from "./config";
import { prisma } from "@/lib/db";

/**
 * The authorization layer. Every page, server action and route handler that touches
 * user data must go through one of these; the Proxy only does a quick cookie check
 * and is not a security boundary on its own.
 */

/**
 * Signed in (email verified), but they may not have finished registering yet. Always the REAL
 * signed-in identity — never substitutes an impersonated user. requireAdmin() (src/lib/auth/admin.ts)
 * builds on this, not on requireRegisteredUser(), for exactly that reason: an admin viewing the app
 * as someone else must never have that substitution leak into an admin check.
 */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  // A suspended user is signed out on their very next request, not just blocked from a new
  // sign-in — suspendUser() also proactively deletes their Sessions, so this is a fallback for
  // whenever that hasn't reached them yet (e.g. a tab left open).
  if (user.suspendedAt) {
    await destroySession();
    redirect("/signin?suspended=1");
  }
  return user;
}

/**
 * Signed in AND registered (has a name and university). Use this for anything in the app.
 *
 * If the real signed-in user is an admin AND has an active impersonation cookie, this returns the
 * IMPERSONATED user instead — which is what makes "view the app as them" work for free across
 * every ordinary page, since they all already call this. requireAdmin() deliberately does not go
 * through here (see requireUser() above), so admin routes are unaffected by impersonation.
 */
export const requireRegisteredUser = cache(async () => {
  const real = await requireUser();

  const impersonatedId = (await cookies()).get(AUTH.impersonateCookie)?.value;
  if (impersonatedId && real.role === "ADMIN") {
    const target = await prisma.user.findUnique({ where: { id: impersonatedId } });
    if (target?.registeredAt && !target.suspendedAt) return target;
  }

  if (!real.registeredAt) redirect("/welcome");
  return real;
});

/** For public pages (landing, sign-in) that should send people who are already signed in onward. */
export async function signedInDestination(): Promise<"/" | "/welcome" | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return user.registeredAt ? "/" : "/welcome";
}

/**
 * A database client scoped to the signed-in, registered user. This is the only sanctioned
 * way for app code to reach user data. Redirects to sign-in if there is no session.
 */
export const userDb = cache(async () => {
  const user = await requireRegisteredUser();
  return scopedDb(user.id);
});

/**
 * For route handlers (API endpoints), which should answer 401 rather than redirect.
 * Returns null when nobody is signed in.
 */
export async function getApiContext() {
  const user = await getSessionUser();
  if (!user || !user.registeredAt || user.suspendedAt) return null;
  return { user, db: scopedDb(user.id) };
}

/** For the impersonation banner in AppShell. Null unless the real signed-in user is an admin with an active impersonation cookie. */
export const getImpersonationBanner = cache(async (): Promise<{ realEmail: string; targetEmail: string } | null> => {
  const real = await getSessionUser();
  if (!real || real.role !== "ADMIN") return null;

  const impersonatedId = (await cookies()).get(AUTH.impersonateCookie)?.value;
  if (!impersonatedId) return null;

  const target = await prisma.user.findUnique({ where: { id: impersonatedId } });
  if (!target) return null;

  return { realEmail: real.email, targetEmail: target.email };
});
