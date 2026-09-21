import "server-only";
import { randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import { AUTH, cookiesAreSecure } from "./config";
import { sha256Hex } from "./crypto";

/**
 * Starts a session for `userId` and sets the cookie.
 *
 * The cookie holds a random 256-bit token. The database keeps only its SHA-256 hash,
 * so a leaked copy of the database can't be replayed as a login. The cookie is
 * httpOnly (page scripts can't read it), SameSite=Lax (not sent on cross-site POSTs)
 * and Secure whenever the site is served over https.
 */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + AUTH.sessionDays * 24 * 60 * 60 * 1000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 200) ?? null;

  await prisma.session.create({ data: { tokenHash: sha256Hex(token), userId, expiresAt, userAgent } });
  // Housekeeping: drop sessions that have already expired.
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  (await cookies()).set(AUTH.sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookiesAreSecure(),
    path: "/",
    expires: expiresAt,
  });
}

/** The signed-in user for this request, or null. Cached so it hits the database once per request. */
export const getSessionUser = cache(async () => {
  const token = (await cookies()).get(AUTH.sessionCookie)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256Hex(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  return session.user;
});

/** Signs the current browser out: deletes the session row and the cookie. */
export async function destroySession() {
  const store = await cookies();
  const token = store.get(AUTH.sessionCookie)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: sha256Hex(token) } });
  store.delete(AUTH.sessionCookie);
}
