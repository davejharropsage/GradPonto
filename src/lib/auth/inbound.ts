import "server-only";
import { prisma } from "@/lib/db";

/**
 * Email import: whose mail is this? An inbound email arrives addressed to `<token>@<domain>` with
 * no session behind it, so the token is the credential, the same way a session cookie is — and
 * like the session lookup, this is the one place it's resolved with the raw client. Everything
 * after it uses scopedDb(userId).
 */
export async function findInboxOwner(token: string) {
  const inbox = await prisma.emailInbox.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, registeredAt: true, suspendedAt: true } } },
  });
  // Mail for a suspended or unfinished account is dropped, not queued.
  if (!inbox || !inbox.user.registeredAt || inbox.user.suspendedAt) return null;
  return { inbox, user: inbox.user };
}

/**
 * Users with forwarded emails still waiting to be classified (the AI was busy or over its
 * allowance when they arrived), oldest first, for the scheduled retry in
 * /api/cron/process-inbound. A cross-user read, so it lives here with the raw client; each user's
 * emails are then processed through scopedDb(userId). Stale PROCESSING claims count too:
 * processInboundQueue() returns them to the queue.
 */
export async function usersWithWaitingEmails(limit: number): Promise<string[]> {
  const rows = await prisma.inboundEmail.groupBy({
    by: ["userId"],
    where: { status: { in: ["QUEUED", "PROCESSING"] }, user: { suspendedAt: null } },
    _min: { receivedAt: true },
    orderBy: { _min: { receivedAt: "asc" } },
    take: limit,
  });
  return rows.map((row) => row.userId);
}

/** How long Email import keeps what it received, once it's dealt with (stated in the privacy policy). */
export const EMAIL_IMPORT_RETENTION_DAYS = 90;

/**
 * Deletes everyone's received emails and reviewed suggestions older than the retention period,
 * from the daily /api/cron/process-inbound run. Cross-user, so it lives here with the raw client.
 * Emails still waiting to be read and suggestions still waiting for review are kept, however old;
 * applications created from approved suggestions are the user's own data and aren't touched.
 */
export async function deleteExpiredEmailImportData(now = new Date()) {
  const cutoff = new Date(now.getTime() - EMAIL_IMPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const [emails, suggestions] = await prisma.$transaction([
    prisma.inboundEmail.deleteMany({ where: { status: "DONE", createdAt: { lt: cutoff } } }),
    prisma.emailSuggestion.deleteMany({ where: { state: { not: "PENDING" }, resolvedAt: { lt: cutoff } } }),
  ]);
  return { emails: emails.count, suggestions: suggestions.count };
}
