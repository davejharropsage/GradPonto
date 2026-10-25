import "server-only";
import { scopedDb } from "@/lib/auth/scoped-db";
import { looksLikeDuplicate } from "@/lib/fuzzy";
import { applicationStatusLabels } from "@/lib/labels";
import type { ApplicationStatus } from "./sync-core";

export interface ProposalEdits {
  company?: string;
  roleTitle?: string;
  jobUrl?: string;
  status?: ApplicationStatus;
}

// Statuses that mean the application was sent, so appliedAt can be backfilled from the email date.
const APPLIED_OR_LATER: ApplicationStatus[] = ["APPLIED", "ONLINE_ASSESSMENT", "VIDEO_INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"];

/**
 * Approves one proposal and makes its change: creates the application, or moves the matched one
 * to the proposed (or edited) status, with an activity-log entry saying it came from Gmail. All in
 * one transaction, and the proposal is claimed first (PENDING → APPROVED), so a double click or two
 * tabs can't apply it twice. Returns the application's id.
 */
export async function applyProposal(userId: string, proposalId: string, edits: ProposalEdits = {}): Promise<string> {
  const db = scopedDb(userId);
  return db.$transaction(async (tx) => {
    const proposal = await tx.gmailProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new Error("That suggestion no longer exists.");

    const claimed = await tx.gmailProposal.updateMany({
      where: { id: proposalId, state: "PENDING" },
      data: { state: "APPROVED", resolvedAt: new Date() },
    });
    if (claimed.count !== 1) throw new Error("That suggestion has already been handled.");

    const status = edits.status ?? (proposal.proposedStatus as ApplicationStatus);
    const fromGmail = `From Gmail: "${proposal.subject}" (${proposal.sender})`;

    if (proposal.kind === "NEW_APPLICATION") {
      const company = (edits.company ?? proposal.company).trim();
      const title = (edits.roleTitle ?? proposal.roleTitle).trim() || "Untitled role";
      if (!company) throw new Error("Enter a company name first.");
      const jobUrl = (edits.jobUrl ?? proposal.jobUrl ?? "").trim() || null;

      // Reuse an existing employer when the name is close enough (same rule as the duplicate-employer warning).
      const employers = await tx.employer.findMany({ select: { id: true, name: true } });
      const employerId =
        employers.find((employer) => looksLikeDuplicate(employer.name, company))?.id ??
        (await tx.employer.create({ data: { name: company } })).id;

      const application = await tx.application.create({
        data: {
          title,
          jobUrl,
          status,
          employerId,
          source: "Gmail",
          notes: proposal.reference ? `Reference: ${proposal.reference}` : null,
          appliedAt: APPLIED_OR_LATER.includes(status) ? proposal.receivedAt : null,
        },
      });
      await tx.activity.create({
        data: { type: "NOTE", subject: `Added from Gmail as ${applicationStatusLabels[status]}`, notes: fromGmail, applicationId: application.id },
      });
      await tx.gmailProposal.update({ where: { id: proposalId }, data: { applicationId: application.id } });
      return application.id;
    }

    if (!proposal.applicationId) throw new Error("The application this would update has been deleted.");
    const application = await tx.application.findUnique({ where: { id: proposal.applicationId } });
    if (!application) throw new Error("The application this would update has been deleted.");

    await tx.application.update({
      where: { id: application.id },
      data: {
        status,
        appliedAt: application.appliedAt ?? (APPLIED_OR_LATER.includes(status) ? proposal.receivedAt : null),
      },
    });
    if (application.status !== status) {
      await tx.activity.create({
        data: {
          type: "STATUS_CHANGE",
          subject: `Status changed: ${applicationStatusLabels[application.status]} → ${applicationStatusLabels[status]}`,
          notes: fromGmail,
          applicationId: application.id,
        },
      });
    }
    return application.id;
  });
}

export async function rejectProposal(userId: string, proposalId: string): Promise<void> {
  const db = scopedDb(userId);
  const result = await db.gmailProposal.updateMany({
    where: { id: proposalId, state: "PENDING" },
    data: { state: "REJECTED", resolvedAt: new Date() },
  });
  if (result.count !== 1) throw new Error("That suggestion has already been handled.");
}
