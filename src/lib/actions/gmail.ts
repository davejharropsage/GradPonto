"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { requireAdmin, logAdminAction } from "@/lib/auth/admin";
import { scopedDb } from "@/lib/auth/scoped-db";
import { applicationStatuses } from "@/lib/labels";
import { revokeRefreshToken } from "@/lib/gmail/google";
import { syncGmail, type SyncSummary } from "@/lib/gmail/sync";
import { applyProposal, rejectProposal as rejectProposalFor, type ProposalEdits } from "@/lib/gmail/apply";

// "Sync from Gmail" — admin-only for now. Every action resolves the REAL signed-in admin through
// requireAdmin() and scopes to them directly (scopedDb(admin.id)) rather than going through
// userDb(): an admin impersonating someone must never pull their own mail into, or approve
// changes onto, the other person's applications.

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
  revalidatePath("/admin/gmail");
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

export async function syncGmailNow(): Promise<ActionResult<SyncSummary>> {
  return tryAction(async () => {
    const admin = await requireAdmin();
    const summary = await syncGmail(admin);
    revalidatePath("/admin/gmail");
    return summary;
  });
}

export async function approveGmailProposal(id: string, edits?: ProposalEdits): Promise<ActionResult<string>> {
  return tryAction(async () => {
    const admin = await requireAdmin();
    const parsed = editsSchema.safeParse(edits);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the details and try again.");
    const applicationId = await applyProposal(admin.id, id, parsed.data);
    revalidateAfterApply();
    return applicationId;
  });
}

/** Approves every pending suggestion, oldest email first, using any edits made on screen. One failure doesn't stop the rest; failures are reported per item. */
export async function approveAllGmailProposals(
  edits: Record<string, ProposalEdits> = {}
): Promise<ActionResult<{ approved: number; failed: { id: string; error: string }[] }>> {
  return tryAction(async () => {
    const admin = await requireAdmin();
    const pending = await scopedDb(admin.id).gmailProposal.findMany({
      where: { state: "PENDING" },
      orderBy: { receivedAt: "asc" },
      select: { id: true },
    });
    let approved = 0;
    const failed: { id: string; error: string }[] = [];
    for (const { id } of pending) {
      const parsed = editsSchema.safeParse(edits[id]);
      try {
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the details and try again.");
        await applyProposal(admin.id, id, parsed.data);
        approved++;
      } catch (error) {
        failed.push({ id, error: error instanceof Error ? error.message : "Something went wrong" });
      }
    }
    revalidateAfterApply();
    return { approved, failed };
  });
}

export async function rejectGmailProposal(id: string): Promise<ActionResult<null>> {
  return tryAction(async () => {
    const admin = await requireAdmin();
    await rejectProposalFor(admin.id, id);
    revalidatePath("/admin/gmail");
    return null;
  });
}

/** Revokes the grant at Google (best effort) and forgets the token. Pending suggestions and the processed-email ledger are kept. */
export async function disconnectGmail(): Promise<ActionResult<null>> {
  return tryAction(async () => {
    const admin = await requireAdmin();
    const db = scopedDb(admin.id);
    const connection = await db.gmailConnection.findUnique({ where: { userId: admin.id } });
    if (connection) {
      await revokeRefreshToken(connection.refreshTokenSealed);
      await db.gmailConnection.delete({ where: { userId: admin.id } });
      await logAdminAction(admin, "gmail.disconnect", { id: admin.id, email: admin.email }, connection.email);
    }
    revalidatePath("/admin/gmail");
    return null;
  });
}
