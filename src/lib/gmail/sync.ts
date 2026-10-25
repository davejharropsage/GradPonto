import "server-only";
import { scopedDb } from "@/lib/auth/scoped-db";
import { consumeAiAllowance } from "@/lib/ai/limit";
import { classifyEmails, CLASSIFY_BATCH_SIZE, type EmailForClassification } from "@/lib/ai/classify-email";
import {
  accessTokenFor,
  getFullMessage,
  getMessageMetadata,
  headerValue,
  listMessageIds,
  type GmailApiMessage,
} from "./google";
import {
  buildGmailQuery,
  extractBodyText,
  planProposals,
  prefilterMessage,
  unprocessedIds,
  type ApplicationStatus,
  type ClassifiedEmail,
  type SkipReason,
} from "./sync-core";

// How much one "Sync now" press does. A scan that finds more than this processes the oldest first,
// leaves the rest for the next press (summary.more), and doesn't move lastSyncedAt on until it's
// caught up — nothing is lost, and the processed-message ledger stops anything being done twice.
const MAX_LISTED = 500;
const MAX_PROCESSED_PER_RUN = 40;
const FETCH_CONCURRENCY = 8;
// Stay inside the page's maxDuration (60s, see admin/gmail/page.tsx): no new AI batch after this.
const TIME_BUDGET_MS = 40_000;

export interface SyncSummary {
  listed: number;
  alreadyProcessed: number;
  skipped: Partial<Record<SkipReason, number>>;
  classified: number;
  proposalsCreated: number;
  proposalsUpdated: number;
  /** True when there's more to process: run it again. */
  more: boolean;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function receivedAt(message: GmailApiMessage): Date {
  const ms = Number(message.internalDate);
  return Number.isFinite(ms) && ms > 0 ? new Date(ms) : new Date();
}

/**
 * One scan of the connected mailbox for `user` (always the real signed-in admin — see the
 * callers). Writes proposals and the processed-message ledger only; never touches Application.
 */
export async function syncGmail(user: { id: string; email: string }): Promise<SyncSummary> {
  const db = scopedDb(user.id);
  const connection = await db.gmailConnection.findUnique({ where: { userId: user.id } });
  if (!connection) throw new Error("Connect Gmail first.");

  const startedAt = new Date();
  const accessToken = await accessTokenFor(connection.refreshTokenSealed);

  const listed = await listMessageIds(accessToken, buildGmailQuery(connection.lastSyncedAt, startedAt), MAX_LISTED);
  const processed = await db.gmailMessage.findMany({ where: { messageId: { in: listed } }, select: { messageId: true } });
  // Gmail lists newest first; work oldest first so a run that stops early leaves the newest for later
  // and proposals reflect events in the order they happened.
  const fresh = unprocessedIds(listed, processed.map((row) => row.messageId)).reverse();
  const batch = fresh.slice(0, MAX_PROCESSED_PER_RUN);
  let more = fresh.length > batch.length || listed.length >= MAX_LISTED;

  const summary: SyncSummary = {
    listed: listed.length,
    alreadyProcessed: listed.length - fresh.length,
    skipped: {},
    classified: 0,
    proposalsCreated: 0,
    proposalsUpdated: 0,
    more,
  };
  const outcomes = new Map<string, string>();

  // 1. Pre-filter on headers.
  const ownAddresses = [connection.email, user.email];
  const metadata = await mapLimit(batch, FETCH_CONCURRENCY, (id) => getMessageMetadata(accessToken, id));
  const kept: GmailApiMessage[] = [];
  for (const message of metadata) {
    const verdict = prefilterMessage(
      {
        from: headerValue(message, "From"),
        to: headerValue(message, "To"),
        cc: headerValue(message, "Cc"),
        subject: headerValue(message, "Subject"),
        listUnsubscribe: headerValue(message, "List-Unsubscribe"),
        listId: headerValue(message, "List-Id"),
        snippet: message.snippet,
      },
      ownAddresses
    );
    if (verdict.keep) {
      kept.push(message);
    } else {
      outcomes.set(message.id, `skipped:${verdict.reason}`);
      summary.skipped[verdict.reason] = (summary.skipped[verdict.reason] ?? 0) + 1;
    }
  }

  // 2. Classify what's left, a batch per AI request.
  const full = await mapLimit(kept, FETCH_CONCURRENCY, (message) => getFullMessage(accessToken, message.id));
  const byId = new Map(full.map((message) => [message.id, message]));
  const classified: (ClassifiedEmail & { reference: string; message: GmailApiMessage })[] = [];

  for (let i = 0; i < full.length; i += CLASSIFY_BATCH_SIZE) {
    if (Date.now() - startedAt.getTime() > TIME_BUDGET_MS) {
      // Not recorded in the ledger, so they're picked up again next run.
      more = true;
      break;
    }
    const chunk = full.slice(i, i + CLASSIFY_BATCH_SIZE);
    await consumeAiAllowance(user.id);
    const emails: EmailForClassification[] = chunk.map((message) => ({
      id: message.id,
      from: headerValue(message, "From") ?? "",
      subject: headerValue(message, "Subject") ?? "",
      date: receivedAt(message).toISOString(),
      body: extractBodyText(message.payload) || message.snippet || "",
    }));
    const results = await classifyEmails(emails);
    const answered = new Map(results.map((result) => [result.id, result]));
    for (const message of chunk) {
      const result = answered.get(message.id);
      summary.classified++;
      // Not an application email, or the model skipped it: recorded as irrelevant by the plan below.
      classified.push({
        messageId: message.id,
        company: result?.isApplicationEmail ? result.company.trim() : "",
        roleTitle: result?.isApplicationEmail ? result.roleTitle.trim() : "",
        jobUrl: result?.isApplicationEmail && /^https?:\/\//i.test(result.jobUrl) ? result.jobUrl.trim() : null,
        reference: result?.isApplicationEmail ? result.reference.trim() : "",
        event: result?.isApplicationEmail ? result.event : "other",
        confidence: result?.confidence ?? 0,
        message,
      });
    }
  }
  classified.sort((a, b) => receivedAt(a.message).getTime() - receivedAt(b.message).getTime());

  // 3. Match against applications and pending proposals, and write it all down together.
  const [applications, pending] = await Promise.all([
    db.application.findMany({ include: { employer: true } }),
    db.gmailProposal.findMany({ where: { state: "PENDING" } }),
  ]);
  const steps = planProposals(
    classified,
    applications.map((application) => ({
      id: application.id,
      company: application.employer?.name ?? "",
      title: application.title,
      jobUrl: application.jobUrl,
      status: application.status as ApplicationStatus,
      archived: application.archived,
      updatedAt: application.updatedAt,
    })),
    pending.map((proposal) => ({
      id: proposal.id,
      kind: proposal.kind,
      applicationId: proposal.applicationId,
      company: proposal.company,
      roleTitle: proposal.roleTitle,
      jobUrl: proposal.jobUrl,
      proposedStatus: proposal.proposedStatus as ApplicationStatus,
    }))
  );
  const emailById = new Map(classified.map((email) => [email.messageId, email]));

  await db.$transaction(async (tx) => {
    // planProposals names proposals it creates "new:<n>", in creation order; this maps them to real ids.
    const createdIds: string[] = [];
    const realId = (id: string) => (id.startsWith("new:") ? createdIds[Number(id.slice(4))] : id);

    for (const step of steps) {
      if (step.type === "skip") {
        outcomes.set(step.messageId, step.outcome);
        continue;
      }
      const email = emailById.get(step.messageId)!;
      const message = byId.get(step.messageId)!;
      const source = {
        messageId: message.id,
        threadId: message.threadId,
        subject: (headerValue(message, "Subject") ?? "(no subject)").slice(0, 300),
        sender: (headerValue(message, "From") ?? "").slice(0, 300),
        snippet: decodeEntities(message.snippet ?? "").slice(0, 400),
        receivedAt: receivedAt(message),
        event: email.event,
        confidence: email.confidence,
      };

      if (step.type === "create") {
        const proposal = await tx.gmailProposal.create({
          data: {
            ...source,
            kind: step.kind,
            company: email.company.slice(0, 200),
            roleTitle: email.roleTitle.slice(0, 200),
            jobUrl: email.jobUrl?.slice(0, 2000) ?? null,
            reference: email.reference.slice(0, 100) || null,
            proposedStatus: step.proposedStatus,
            applicationId: step.applicationId,
            fromStatus: step.fromStatus,
          },
        });
        createdIds.push(proposal.id);
        summary.proposalsCreated++;
      } else {
        const id = realId(step.proposalId);
        const existing = await tx.gmailProposal.findUniqueOrThrow({ where: { id } });
        await tx.gmailProposal.update({
          where: { id },
          data: {
            ...source,
            proposedStatus: step.proposedStatus,
            // Keep what an earlier email told us if this one is vaguer.
            roleTitle: existing.roleTitle || email.roleTitle.slice(0, 200),
            jobUrl: existing.jobUrl ?? email.jobUrl ?? null,
            reference: existing.reference ?? (email.reference.slice(0, 100) || null),
          },
        });
        if (!step.proposalId.startsWith("new:")) summary.proposalsUpdated++;
      }
      outcomes.set(step.messageId, "proposed");
    }

    if (outcomes.size > 0) {
      await tx.gmailMessage.createMany({
        data: [...outcomes].map(([messageId, outcome]) => ({ messageId, outcome })),
        skipDuplicates: true,
      });
    }
    if (!more) await tx.gmailConnection.update({ where: { userId: user.id }, data: { lastSyncedAt: startedAt } });
  });

  summary.more = more;
  return summary;
}

// Gmail's snippet is HTML-escaped.
function decodeEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
