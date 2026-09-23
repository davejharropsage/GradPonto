import "server-only";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import { AUTH } from "./config";
import { hashLoginCode, safeEqualHex } from "./crypto";
import type { LoginCodePurpose } from "@/generated/prisma/client";

export type IssueResult =
  | { ok: true; code: string }
  | { ok: false; reason: "cooldown"; retryAfterSeconds: number }
  | { ok: false; reason: "hourly-limit" };

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "locked" | "none" };

/**
 * Creates a new one-time code for `email` (already normalised to lower case), for the given
 * `purpose` (verifying a new signup, or authorising a password reset — never signing in directly
 * any more). Purposes have entirely separate rate-limit/cooldown windows, so requesting a reset
 * code can't be blocked by an unrelated signup code sent moments earlier, or vice versa.
 *
 * Limits how often codes can be requested for one address so this can't be used to
 * spam someone's inbox, and invalidates any earlier unused code of the same purpose so only the
 * newest works. Only an HMAC of the code is stored; the plain code is returned once, for emailing.
 */
export async function issueLoginCode(email: string, purpose: LoginCodePurpose): Promise<IssueResult> {
  const now = Date.now();
  const recent = await prisma.loginCode.findMany({
    where: { email, purpose, createdAt: { gt: new Date(now - 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, consumedAt: true, expiresAt: true },
  });

  if (recent.length >= AUTH.maxCodesPerEmailPerHour) return { ok: false, reason: "hourly-limit" };

  // The cooldown only protects a code that is still waiting to be used. If the last code was
  // already used, or has expired, they need a fresh one now.
  const last = recent[0];
  if (last && !last.consumedAt && last.expiresAt.getTime() > now) {
    const sinceLast = (now - last.createdAt.getTime()) / 1000;
    if (sinceLast < AUTH.resendCooldownSeconds) {
      return { ok: false, reason: "cooldown", retryAfterSeconds: Math.ceil(AUTH.resendCooldownSeconds - sinceLast) };
    }
  }

  const code = String(randomInt(0, 10 ** AUTH.codeLength)).padStart(AUTH.codeLength, "0");

  await prisma.$transaction([
    prisma.loginCode.updateMany({ where: { email, purpose, consumedAt: null }, data: { consumedAt: new Date(now) } }),
    prisma.loginCode.create({
      data: {
        email,
        purpose,
        codeHash: hashLoginCode(email, code),
        expiresAt: new Date(now + AUTH.codeTtlMinutes * 60 * 1000),
      },
    }),
  ]);

  // Housekeeping: nothing older than a day is ever useful.
  await prisma.loginCode.deleteMany({ where: { createdAt: { lt: new Date(now - 24 * 60 * 60 * 1000) } } });

  return { ok: true, code };
}

/**
 * Checks a code the user typed, for the given `purpose`. On success the code is used up
 * (single use).
 *
 * The attempt is counted BEFORE the comparison, in one atomic update, so a burst of
 * parallel guesses can't sneak past the attempt limit.
 */
export async function verifyLoginCode(email: string, input: string, purpose: LoginCodePurpose): Promise<VerifyResult> {
  const code = input.replace(/\D/g, "");
  if (code.length !== AUTH.codeLength) return { ok: false, reason: "invalid" };

  const row = await prisma.loginCode.findFirst({
    where: { email, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return { ok: false, reason: "none" };
  if (row.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };

  const reserved = await prisma.loginCode.updateMany({
    where: { id: row.id, consumedAt: null, attempts: { lt: AUTH.maxAttemptsPerCode } },
    data: { attempts: { increment: 1 } },
  });
  if (reserved.count === 0) return { ok: false, reason: "locked" };

  if (!safeEqualHex(row.codeHash, hashLoginCode(email, code))) return { ok: false, reason: "invalid" };

  // Only one concurrent request can flip consumedAt; the rest lose.
  const consumed = await prisma.loginCode.updateMany({
    where: { id: row.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return consumed.count === 1 ? { ok: true } : { ok: false, reason: "invalid" };
}
