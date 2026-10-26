import "server-only";
import { scopedDb } from "@/lib/auth/scoped-db";
import { canonicalAddress, parseAddresses, parseForwardingConfirmation, prefilterMessage, unprocessedIds } from "./core";
import { unwrapForwards, type IncomingEmail } from "./parse";

const SNIPPET_CHARS = 400;
// Plenty for classification (the AI only reads the first 2,500 characters).
const BODY_CHARS = 8000;
/** Addresses remembered per user — a guard against a flood of forwards from made-up senders. */
const MAX_KNOWN_ADDRESSES = 10;

export type IngestResult =
  | { kind: "forwarding-confirmation" }
  | { kind: "emails"; received: number; queued: number; skipped: number; duplicates: number };

/**
 * Files one message that arrived at a user's inbound address. Fast and AI-free: it records each
 * forwarded email (dedupe by Message-ID), drops what the pre-filter rejects, and queues the rest
 * for lib/inbound/process.ts to classify.
 */
export async function ingestInboundEmail(
  owner: { userId: string; userEmail: string; knownAddresses: string[] },
  email: IncomingEmail
): Promise<IngestResult> {
  const db = scopedDb(owner.userId);
  const now = new Date();

  const confirmation = parseForwardingConfirmation(email);
  if (confirmation) {
    await db.emailInbox.update({
      where: { userId: owner.userId },
      data: {
        forwardingCode: confirmation.code,
        forwardingUrl: confirmation.url,
        forwardingFrom: confirmation.from,
        forwardingRequestedAt: now,
        lastReceivedAt: now,
        knownAddresses: withAddress(owner.knownAddresses, confirmation.from, owner.userEmail),
      },
    });
    return { kind: "forwarding-confirmation" };
  }

  const { wrapperFrom, emails } = await unwrapForwards(email);

  // Someone forwarding mail here by hand is forwarding their own mail: remember the address, so the
  // "addressed to you" check accepts the emails inside.
  const knownAddresses = withAddress(owner.knownAddresses, parseAddresses(wrapperFrom ?? "")[0] ?? null, owner.userEmail);
  const ownAddresses = [owner.userEmail, ...knownAddresses];

  const existing = await db.inboundEmail.findMany({
    where: { messageKey: { in: emails.map((e) => e.messageKey) } },
    select: { messageKey: true },
  });
  const freshKeys = new Set(unprocessedIds(emails.map((e) => e.messageKey), existing.map((row) => row.messageKey)));
  const fresh = emails.filter((e) => freshKeys.delete(e.messageKey));

  let queued = 0;
  const rows = fresh.map((candidate) => {
    const verdict = prefilterMessage(
      {
        from: candidate.from,
        to: candidate.to,
        cc: candidate.cc,
        subject: candidate.subject,
        listUnsubscribe: candidate.listUnsubscribe,
        listId: candidate.listId,
        snippet: candidate.text.slice(0, 300),
      },
      ownAddresses
    );
    if (verdict.keep) queued++;
    return {
      messageKey: candidate.messageKey,
      originalMessageId: candidate.originalMessageId?.slice(0, 500) ?? null,
      sender: candidate.from.slice(0, 300),
      subject: (candidate.subject || "(no subject)").slice(0, 300),
      snippet: candidate.text.replace(/\s+/g, " ").trim().slice(0, SNIPPET_CHARS),
      receivedAt: candidate.receivedAt,
      bodyText: verdict.keep ? candidate.text.slice(0, BODY_CHARS) : null,
      status: verdict.keep ? ("QUEUED" as const) : ("DONE" as const),
      outcome: verdict.keep ? null : `skipped:${verdict.reason}`,
    };
  });

  await db.$transaction([
    ...(rows.length > 0 ? [db.inboundEmail.createMany({ data: rows, skipDuplicates: true })] : []),
    db.emailInbox.update({ where: { userId: owner.userId }, data: { lastReceivedAt: now, knownAddresses } }),
  ]);

  return {
    kind: "emails",
    received: emails.length,
    queued,
    skipped: rows.length - queued,
    duplicates: emails.length - fresh.length,
  };
}

function withAddress(addresses: string[], address: string | null, userEmail: string): string[] {
  if (!address) return addresses;
  const canonical = canonicalAddress(address);
  if (canonical === canonicalAddress(userEmail) || addresses.some((a) => canonicalAddress(a) === canonical)) return addresses;
  if (addresses.length >= MAX_KNOWN_ADDRESSES) return addresses;
  return [...addresses, address.toLowerCase()];
}
