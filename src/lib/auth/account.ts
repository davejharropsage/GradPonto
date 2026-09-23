import "server-only";
import { prisma } from "@/lib/db";

/** The only code outside the scoped client that touches the User table. */

/** True if ADMIN_EMAILS (comma-separated, case-insensitive) lists this address. */
function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** Their email is proven: create the account if it's new, or find it, and note the sign-in. */
export function upsertVerifiedUser(email: string) {
  const now = new Date();
  // Only ever grants ADMIN, never sets USER explicitly — so removing an email from ADMIN_EMAILS
  // (or leaving it blank) can't silently demote someone who was made an admin another way.
  const role = isAdminEmail(email) ? ("ADMIN" as const) : undefined;
  return prisma.user.upsert({
    where: { email },
    create: { email, emailVerifiedAt: now, lastLoginAt: now, ...(role && { role }) },
    update: { emailVerifiedAt: now, lastLoginAt: now, ...(role && { role }) },
  });
}

/**
 * Starts a new signup: creates the account (unverified) with its password. If an earlier signup
 * with this email was started but never verified, this resets its password and picks up where it
 * left off rather than erroring — a very normal thing to happen (they mistyped, or just didn't
 * finish). Returns null if `email` belongs to an already-verified account, so the caller can point
 * them to sign-in or forgot-password instead of silently overwriting a real password.
 */
export async function upsertPendingSignup(email: string, passwordHash: string) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { emailVerifiedAt: true } });
  if (existing?.emailVerifiedAt) return null;

  const role = isAdminEmail(email) ? ("ADMIN" as const) : undefined;
  return prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, ...(role && { role }) },
    update: { passwordHash, ...(role && { role }) },
  });
}

/** Marks the account's email as verified once the signup code is confirmed correct. */
export function markEmailVerified(email: string) {
  const now = new Date();
  return prisma.user.update({ where: { email }, data: { emailVerifiedAt: now, lastLoginAt: now } });
}

/** Looks a signed-in candidate up by email for signInAction. Only the fields it needs to decide. */
export function findUserForSignIn(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, emailVerifiedAt: true, registeredAt: true, suspendedAt: true },
  });
}

export function recordSignIn(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

/**
 * Sets a new password once a reset code has been verified — the exact same flow whether the
 * account had no password yet (Lucas's account today, and anyone else who predates password
 * sign-in) or already had one. Ends every other signed-in session, since a password reset should
 * sign everyone else out, same as changing a password anywhere else. Returns false only if the
 * email somehow doesn't belong to any account (a reset code has no relation to User, so this is
 * the one place that's re-checked).
 */
export async function resetPassword(email: string, passwordHash: string): Promise<boolean> {
  const result = await prisma.user.updateMany({ where: { email }, data: { passwordHash } });
  if (result.count === 0) return false;
  await prisma.session.deleteMany({ where: { user: { email } } });
  return true;
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
