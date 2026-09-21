import "server-only";
import { prisma } from "@/lib/db";

/** The only code outside the scoped client that touches the User table. */

/** Their email is proven: create the account if it's new, or find it, and note the sign-in. */
export function upsertVerifiedUser(email: string) {
  const now = new Date();
  return prisma.user.upsert({
    where: { email },
    create: { email, emailVerifiedAt: now, lastLoginAt: now },
    update: { emailVerifiedAt: now, lastLoginAt: now },
  });
}

/**
 * Finishes registration. Only takes effect if it hasn't been completed yet, so a
 * double-click or a replayed request can't register twice (or send a second email).
 * Returns true if this call is the one that completed it.
 */
export async function completeRegistration(userId: string, details: { name: string; university: string }) {
  const result = await prisma.user.updateMany({
    where: { id: userId, registeredAt: null },
    data: { ...details, registeredAt: new Date() },
  });
  return result.count === 1;
}

export function updateProfileDetails(userId: string, details: { name: string; university: string }) {
  return prisma.user.update({ where: { id: userId }, data: details });
}

export function updatePlan(userId: string, plan: "FREE" | "PRO") {
  return prisma.user.update({ where: { id: userId }, data: { plan } });
}
