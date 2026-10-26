import "server-only";
import { prisma } from "@/lib/db";

/**
 * Daily caps on everything that costs money or has a shared quota. Counted from UsageEvent rows in
 * the database, so they hold across all of Vercel's server instances (unlike the in-memory
 * per-hour limiters, which are a first, cheap line of defence). Days are UTC.
 *
 * Each cap can be changed with an environment variable, without a code change:
 */
export const DAILY_LIMITS = {
  /** Gemini/Claude requests for the whole app. */
  AI: { env: "AI_DAILY_LIMIT", fallback: 1000 },
  /** Gemini/Claude requests per person. */
  AI_PER_USER: { env: "AI_DAILY_LIMIT_PER_USER", fallback: 100 },
  /** Adzuna searches for the whole app (the free key allows 250 a day). */
  ADZUNA: { env: "ADZUNA_DAILY_LIMIT", fallback: 200 },
  /** Emails sent over SMTP (sign-up codes, resets, welcomes) for the whole app. */
  MAIL: { env: "MAIL_DAILY_LIMIT", fallback: 250 },
  /** Emails received by Email import (Postmark bills per email) for the whole app. */
  INBOUND: { env: "INBOUND_DAILY_LIMIT", fallback: 1000 },
  /** Emails received by Email import per person. */
  INBOUND_PER_USER: { env: "INBOUND_DAILY_LIMIT_PER_USER", fallback: 150 },
} as const;

export type UsageKind = "AI" | "ADZUNA" | "MAIL" | "INBOUND";

export function dailyLimit(name: keyof typeof DAILY_LIMITS): number {
  const { env, fallback } = DAILY_LIMITS[name];
  const value = Number(process.env[env]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export function startOfUtcDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function usageToday(kind: UsageKind, userId?: string): Promise<number> {
  return prisma.usageEvent.count({ where: { kind, createdAt: { gte: startOfUtcDay() }, ...(userId ? { userId } : {}) } });
}

/**
 * Checks today's usage of `kind` against the app-wide cap (and the per-user one, if given) and, if
 * there's room, records one more use. Returns which cap was hit otherwise. Reaching the app-wide cap
 * alerts the owner, since it means either real growth or abuse.
 *
 * Check-then-record isn't atomic, so a burst can overshoot a cap by a request or two; fine for a
 * spending guard, which only needs to stop runaway use.
 */
export async function takeDailyAllowance(
  kind: UsageKind,
  caps: { total: keyof typeof DAILY_LIMITS; perUser?: keyof typeof DAILY_LIMITS },
  userId?: string
): Promise<{ ok: true } | { ok: false; scope: "user" | "total" }> {
  const [total, mine] = await Promise.all([usageToday(kind), userId && caps.perUser ? usageToday(kind, userId) : Promise.resolve(0)]);

  if (userId && caps.perUser && mine >= dailyLimit(caps.perUser)) return { ok: false, scope: "user" };
  if (total >= dailyLimit(caps.total)) {
    // Imported lazily: monitoring → mailer → limits would otherwise be a cycle.
    const { alertOwner } = await import("@/lib/monitoring");
    await alertOwner(
      `limit:${kind}`,
      `Daily ${kind} limit reached`,
      `GradPonto has used its daily allowance of ${dailyLimit(caps.total)} for ${kind} (${DAILY_LIMITS[caps.total].env}). ` +
        `Until midnight UTC, those requests are refused with a "try again tomorrow" message.\n\n` +
        `If this is real growth, raise ${DAILY_LIMITS[caps.total].env} in Vercel's environment variables. If it isn't, check the admin Usage page and the logs for abuse.`
    );
    return { ok: false, scope: "total" };
  }

  await prisma.usageEvent.create({ data: { kind, userId: userId ?? null } });
  return { ok: true };
}
