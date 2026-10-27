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
