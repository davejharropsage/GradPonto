import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/auth/mailer";

/**
 * Error logging and owner alerts. Everything that goes wrong on the server ends up in logError()
 * (Vercel → Logs), and anything that needs a human — an unexpected crash, an AI outage, a daily
 * spending cap reached — also goes to alertOwner(), which emails ALERT_EMAIL (or, if that's
 * unset, everyone in ADMIN_EMAILS).
 *
 * Alerts are throttled in the database, not in memory, so it holds across Vercel's many server
 * instances: at most one email per distinct problem per hour, and ALERTS_PER_DAY in total. Like
 * lib/ai/limit.ts, this uses the raw client for UsageEvent, an app-wide table (see admin.ts).
 */

const ALERT_REPEAT_MS = 60 * 60 * 1000;
const ALERTS_PER_DAY = 20;

function describe(error: unknown): { name: string; message: string; stack?: string; digest?: string } {
  if (error instanceof Error) {
    const digest = "digest" in error ? String((error as { digest?: unknown }).digest) : undefined;
    return { name: error.name, message: error.message, stack: error.stack, digest };
  }
  return { name: "NonError", message: typeof error === "string" ? error : JSON.stringify(error) };
}

/** One line per failure in the server logs, with where it happened and any useful context. */
export function logError(context: string, error: unknown, extra: Record<string, unknown> = {}) {
  const { name, message, stack, digest } = describe(error);
  console.error(`[gradponto] ${context}: ${name}: ${message}`, { ...extra, ...(digest ? { digest } : {}) }, stack ?? "");
}

function alertRecipients(): string[] {
  const raw = process.env.ALERT_EMAIL || process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((address) => address.trim())
    .filter((address) => address.includes("@"));
}

function startOfUtcDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Emails the owner about a problem. `key` identifies the problem for throttling: the same key
 * alerts at most once an hour. Never throws — a broken alert must not break the request that
 * triggered it (and if email itself is what's broken, the logs are all there is).
 */
export async function alertOwner(key: string, subject: string, details: string): Promise<void> {
  try {
    const recipients = alertRecipients();
    if (recipients.length === 0) return;

    const kind = `ALERT:${createHash("sha256").update(key).digest("hex").slice(0, 16)}`;
    const [recent, today] = await Promise.all([
      prisma.usageEvent.count({ where: { kind, createdAt: { gte: new Date(Date.now() - ALERT_REPEAT_MS) } } }),
      prisma.usageEvent.count({ where: { kind: { startsWith: "ALERT:" }, createdAt: { gte: startOfUtcDay() } } }),
    ]);
    if (recent > 0 || today >= ALERTS_PER_DAY) return;
    await prisma.usageEvent.create({ data: { kind } });

    const site = process.env.APP_URL || "GradPonto";
    const text = [
      details,
      "",
      `Where: ${site} (${process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown"})`,
      `When: ${new Date().toISOString()}`,
      "",
      "Full details are in Vercel → your project → Logs. You'll get at most one email an hour about this same problem.",
    ].join("\n");
    await Promise.all(
      recipients.map((to) =>
        sendMail({ to, subject: `[GradPonto alert] ${subject}`, text, html: `<pre style="font-family:monospace;white-space:pre-wrap">${escapeHtml(text)}</pre>` }, { alert: true })
      )
    );
  } catch (error) {
    logError("alertOwner", error, { key });
  }
}

/** logError + alertOwner, for failures someone needs to look at. */
export async function reportError(context: string, error: unknown, extra: Record<string, unknown> = {}): Promise<void> {
  logError(context, error, extra);
  const { name, message, digest } = describe(error);
  const where = Object.entries(extra)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join("\n");
  await alertOwner(
    `${context}|${name}|${digest ?? message.slice(0, 120)}`,
    `${context}: ${message.slice(0, 80)}`,
    [`Something went wrong in ${context}.`, "", `${name}: ${message}`, ...(digest ? [`Digest: ${digest}`] : []), ...(where ? ["", where] : [])].join("\n")
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
