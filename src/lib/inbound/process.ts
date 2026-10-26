import "server-only";
import { randomUUID } from "node:crypto";
import { scopedDb } from "@/lib/auth/scoped-db";
import { consumeAiAllowance } from "@/lib/ai/limit";
import { classifyEmails, CLASSIFY_BATCH_SIZE } from "@/lib/ai/classify-email";
import { planProposals, type ApplicationStatus, type ClassifiedEmail } from "./core";

// Stay inside the callers' maxDuration (60s): no new AI batch after this.
const TIME_BUDGET_MS = 40_000;
// A claim older than this belonged to a run that died (timeout, crash); its emails go back in the queue.
const STALE_CLAIM_MS = 5 * 60 * 1000;

export interface ProcessResult {
  classified: number;
  created: number;
  updated: number;
  /** Still queued: the time budget ran out, or the AI was unavailable / over its allowance. */
  remaining: number;
  /** Why it stopped early, if it did — safe to show. */
  error?: string;
}

/**
 * Classifies a user's queued emails, a batch per AI request, and turns them into suggestions.
 * Safe to run concurrently (two emails arriving together each trigger one): emails are claimed
 * before classification, and planning + writing happens under a per-user advisory lock, so two
 * runs can't both suggest the same new application.
 */
export async function processInboundQueue(userId: string): Promise<ProcessResult> {
  const db = scopedDb(userId);
  const startedAt = Date.now();
  const result: ProcessResult = { classified: 0, created: 0, updated: 0, remaining: 0 };

  await db.inboundEmail.updateMany({
    where: { status: "PROCESSING", updatedAt: { lt: new Date(startedAt - STALE_CLAIM_MS) } },
    data: { status: "QUEUED", claimId: null },
  });

  while (Date.now() - startedAt < TIME_BUDGET_MS) {
    const next = await db.inboundEmail.findMany({
      where: { status: "QUEUED" },
      orderBy: { receivedAt: "asc" },
      take: CLASSIFY_BATCH_SIZE,
      select: { id: true },
    });
    if (next.length === 0) break;

    const claimId = randomUUID();
    await db.inboundEmail.updateMany({
      where: { id: { in: next.map((row) => row.id) }, status: "QUEUED" },
      data: { status: "PROCESSING", claimId },
    });
    const batch = await db.inboundEmail.findMany({ where: { claimId }, orderBy: { receivedAt: "asc" } });
    if (batch.length === 0) continue; // another run claimed them first

    const release = () => db.inboundEmail.updateMany({ where: { claimId }, data: { status: "QUEUED", claimId: null } });

    let answers;
    try {
      await consumeAiAllowance(userId);
      answers = await classifyEmails(
        batch.map((email) => ({
          id: email.id,
          from: email.sender,
          subject: email.subject,
          date: email.receivedAt.toISOString(),
          body: email.bodyText ?? email.snippet,
        }))
      );
    } catch (error) {
      await release();
      result.error = error instanceof Error ? error.message : "The AI service is unavailable right now.";
      break;
    }

    const byId = new Map(answers.map((answer) => [answer.id, answer]));
    // Not an application email, or the model skipped it: the plan records those as irrelevant.
    const classified: (ClassifiedEmail & { reference: string })[] = batch.map((email) => {
      const answer = byId.get(email.id);
      const relevant = Boolean(answer?.isApplicationEmail);
      return {
        messageId: email.id,
        company: relevant ? answer!.company.trim() : "",
        roleTitle: relevant ? answer!.roleTitle.trim() : "",
        jobUrl: relevant && /^https?:\/\//i.test(answer!.jobUrl) ? answer!.jobUrl.trim() : null,
        reference: relevant ? answer!.reference.trim() : "",
        event: relevant ? answer!.event : "other",
        confidence: answer?.confidence ?? 0,
      };
    });
    result.classified += batch.length;

    await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`inbound:${userId}`}))`;

        const [applications, pending] = await Promise.all([
          tx.application.findMany({ include: { employer: true } }),
          tx.emailSuggestion.findMany({ where: { state: "PENDING" } }),
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
          pending.map((suggestion) => ({
            id: suggestion.id,
            kind: suggestion.kind,
            applicationId: suggestion.applicationId,
            company: suggestion.company,
            roleTitle: suggestion.roleTitle,
            jobUrl: suggestion.jobUrl,
            proposedStatus: suggestion.proposedStatus as ApplicationStatus,
          }))
        );

        const emails = new Map(batch.map((email) => [email.id, email]));
        const extracted = new Map(classified.map((email) => [email.messageId, email]));
        // planProposals names suggestions it creates "new:<n>", in creation order.
        const createdIds: string[] = [];
        const outcomes = new Map<string, string>();

        for (const step of steps) {
          if (step.type === "skip") {
            outcomes.set(step.messageId, step.outcome);
            continue;
          }
          const email = emails.get(step.messageId)!;
          const found = extracted.get(step.messageId)!;
          const source = {
            subject: email.subject,
            sender: email.sender,
            snippet: email.snippet,
            receivedAt: email.receivedAt,
            originalMessageId: email.originalMessageId,
            event: found.event,
            confidence: found.confidence,
          };

          if (step.type === "create") {
            const suggestion = await tx.emailSuggestion.create({
              data: {
                ...source,
                kind: step.kind,
                company: found.company.slice(0, 200),
                roleTitle: found.roleTitle.slice(0, 200),
                jobUrl: found.jobUrl?.slice(0, 2000) ?? null,
                reference: found.reference.slice(0, 100) || null,
                proposedStatus: step.proposedStatus,
                applicationId: step.applicationId,
                fromStatus: step.fromStatus,
              },
            });
            createdIds.push(suggestion.id);
            result.created++;
          } else {
            const fromThisRun = step.proposalId.startsWith("new:");
            const id = fromThisRun ? createdIds[Number(step.proposalId.slice(4))] : step.proposalId;
            const existing = await tx.emailSuggestion.findUniqueOrThrow({ where: { id } });
            await tx.emailSuggestion.update({
              where: { id },
              data: {
                ...source,
                proposedStatus: step.proposedStatus,
                // Keep what an earlier email said if this one is vaguer.
                roleTitle: existing.roleTitle || found.roleTitle.slice(0, 200),
                jobUrl: existing.jobUrl ?? found.jobUrl ?? null,
                reference: existing.reference ?? (found.reference.slice(0, 100) || null),
              },
            });
            if (!fromThisRun) result.updated++;
          }
          outcomes.set(step.messageId, "proposed");
        }

        // Done with the bodies: only the snippet is kept.
        for (const [id, outcome] of outcomes) {
          await tx.inboundEmail.update({ where: { id }, data: { status: "DONE", outcome, bodyText: null, claimId: null } });
        }
      },
      { timeout: 20_000 }
    );
  }

  result.remaining = await db.inboundEmail.count({ where: { status: { in: ["QUEUED", "PROCESSING"] } } });
  return result;
}
