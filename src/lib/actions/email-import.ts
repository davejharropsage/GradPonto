"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { requireRegisteredUser, userDb } from "@/lib/auth/user";
import { applicationStatuses } from "@/lib/labels";
import { canonicalAddress, newInboxToken } from "@/lib/inbound/core";
import { applyProposal, rejectProposal, type ProposalEdits } from "@/lib/inbound/apply";
import { processInboundQueue, type ProcessResult } from "@/lib/inbound/process";

// Same reasoning as lib/actions/analyze.ts: return expected errors instead of throwing, so the
// message survives Next's production error redaction.
type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function tryAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

function revalidateAfterApply() {
  revalidatePath("/email-import");
  revalidatePath("/applications");
  revalidatePath("/pipeline");
  revalidatePath("/deadlines");
  revalidatePath("/");
}

const editsSchema = z
  .object({
    company: z.string().trim().max(200).optional(),
    roleTitle: z.string().trim().max(200).optional(),
    jobUrl: z.union([z.literal(""), z.url().max(2000)]).optional(),
    status: z.enum(applicationStatuses).optional(),
  })
  .optional();

/** Classifies anything still waiting (e.g. the AI was busy when it arrived). */
export async function processEmailsNow(): Promise<ActionResult<ProcessResult>> {
  return tryAction(async () => {
    const user = await requireRegisteredUser();
    const result = await processInboundQueue(user.id);
    revalidatePath("/email-import");
    return result;
  });
}

export async function approveEmailSuggestion(id: string, edits?: ProposalEdits): Promise<ActionResult<string>> {
  return tryAction(async () => {
    const user = await requireRegisteredUser();
    const parsed = editsSchema.safeParse(edits);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the details and try again.");
    const applicationId = await applyProposal(user.id, id, parsed.data);
    revalidateAfterApply();
    return applicationId;
  });
}

/** Approves every pending suggestion, oldest email first, using any edits made on screen. One failure doesn't stop the rest. */
export async function approveAllEmailSuggestions(
  edits: Record<string, ProposalEdits> = {}
): Promise<ActionResult<{ approved: number; failed: { id: string; error: string }[] }>> {
  return tryAction(async () => {
    const user = await requireRegisteredUser();
    const db = await userDb();
    const pending = await db.emailSuggestion.findMany({ where: { state: "PENDING" }, orderBy: { receivedAt: "asc" }, select: { id: true } });
    let approved = 0;
    const failed: { id: string; error: string }[] = [];
    for (const { id } of pending) {
      const parsed = editsSchema.safeParse(edits[id]);
      try {
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the details and try again.");
        await applyProposal(user.id, id, parsed.data);
        approved++;
      } catch (error) {
        failed.push({ id, error: error instanceof Error ? error.message : "Something went wrong" });
      }
    }
    revalidateAfterApply();
    return { approved, failed };
  });
}

export async function rejectEmailSuggestion(id: string): Promise<ActionResult<null>> {
  return tryAction(async () => {
    const user = await requireRegisteredUser();
    await rejectProposal(user.id, id);
    revalidatePath("/email-import");
    return null;
  });
}

/** A new forwarding address; the old one stops working at once. For a leaked address. */
export async function resetInboxAddress(): Promise<ActionResult<null>> {
  return tryAction(async () => {
    const user = await requireRegisteredUser();
    const db = await userDb();
    await db.emailInbox.update({
      where: { userId: user.id },
      data: { token: newInboxToken(), forwardingCode: null, forwardingUrl: null, forwardingFrom: null, forwardingRequestedAt: null },
    });
    revalidatePath("/email-import");
    return null;
  });
}

const addressSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export async function addKnownAddress(address: string): Promise<ActionResult<null>> {
  return tryAction(async () => {
    const user = await requireRegisteredUser();
    const parsed = addressSchema.safeParse(address);
    if (!parsed.success) throw new Error("Enter a valid email address.");
    const db = await userDb();
    const inbox = await db.emailInbox.findUniqueOrThrow({ where: { userId: user.id } });
    const canonical = canonicalAddress(parsed.data);
    if (canonical === canonicalAddress(user.email) || inbox.knownAddresses.some((a) => canonicalAddress(a) === canonical)) return null;
    if (inbox.knownAddresses.length >= 10) throw new Error("That's the most addresses you can add. Remove one first.");
    await db.emailInbox.update({ where: { userId: user.id }, data: { knownAddresses: [...inbox.knownAddresses, parsed.data] } });
    revalidatePath("/email-import");
    return null;
  });
}

export async function removeKnownAddress(address: string): Promise<ActionResult<null>> {
  return tryAction(async () => {
    const user = await requireRegisteredUser();
    const db = await userDb();
    const inbox = await db.emailInbox.findUniqueOrThrow({ where: { userId: user.id } });
    await db.emailInbox.update({
      where: { userId: user.id },
      data: { knownAddresses: inbox.knownAddresses.filter((a) => a !== address) },
    });
    revalidatePath("/email-import");
    return null;
  });
}
