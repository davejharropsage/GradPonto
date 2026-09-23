import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "./user";
import { prisma } from "@/lib/db";

/**
 * Only for `/admin/*` routes and admin server actions. Deliberately resolves the REAL signed-in
 * identity via requireUser() rather than requireRegisteredUser() — an admin viewing the app as
 * someone else (see impersonation) must never be able to smuggle that substitution into an admin
 * check. requireAdmin() always asks "who is really signed in", not "who does this request currently
 * act as".
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/**
 * The raw, unscoped Prisma client, re-exported here under an admin-specific name. Admin tables
 * (User, Session, AuditLog, UsageEvent) are intentionally not registered in scoped-db.ts's
 * OWNED_MODELS — they're not per-user data, they're the platform's own records — so every admin
 * query goes through this, never through userDb(). Only ever call it after requireAdmin() has run.
 */
export { prisma as adminDb };
