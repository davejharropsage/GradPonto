import "server-only";
import { requireRegisteredUser, userDb } from "@/lib/auth/user";
import { newInboxToken } from "@/lib/inbound/core";

/** The signed-in user's inbox, created on first visit (an address costs nothing until mail is sent to it). */
export async function getOrCreateInbox() {
  const user = await requireRegisteredUser();
  const db = await userDb();
  const existing = await db.emailInbox.findUnique({ where: { userId: user.id } });
  if (existing) return existing;
  try {
    return await db.emailInbox.create({ data: { token: newInboxToken(), knownAddresses: [] } });
  } catch {
    // Two tabs racing to create it (or, astronomically unlikely, a token collision): read it back.
    return db.emailInbox.findUniqueOrThrow({ where: { userId: user.id } });
  }
}

/** How many received emails the page lists (newest first). */
export const RECENT_EMAILS_SHOWN = 50;

export async function getEmailImportOverview() {
  const db = await userDb();
  const [suggestions, waiting, received, recent] = await Promise.all([
    db.emailSuggestion.findMany({
      where: { state: "PENDING" },
      orderBy: { receivedAt: "desc" },
      include: { application: { include: { employer: true } } },
    }),
    db.inboundEmail.count({ where: { status: { in: ["QUEUED", "PROCESSING"] } } }),
    db.inboundEmail.count(),
    db.inboundEmail.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_EMAILS_SHOWN,
      select: { id: true, subject: true, sender: true, status: true, outcome: true, createdAt: true },
    }),
  ]);
  return { suggestions, waiting, received, recent };
}
