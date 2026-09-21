import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "./session";
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
  if (!user || !user.registeredAt) return null;
  return { user, db: scopedDb(user.id) };
}
