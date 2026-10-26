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
