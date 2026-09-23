import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionUser, destroySession } from "./session";
import { scopedDb } from "./scoped-db";

/**
 * The authorization layer. Every page, server action and route handler that touches
 * user data must go through one of these; the Proxy only does a quick cookie check
 * and is not a security boundary on its own.
 */

/** Signed in (email verified), but they may not have finished registering yet. */
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

/** Signed in AND registered (has a name and university). Use this for anything in the app. */
export async function requireRegisteredUser() {
  const user = await requireUser();
  if (!user.registeredAt) redirect("/welcome");
  return user;
}

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
