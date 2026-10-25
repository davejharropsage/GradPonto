import { Mail } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { GmailSyncPanel, type ProposalView } from "@/components/admin/gmail-sync-panel";
import { requireAdmin } from "@/lib/auth/admin";
import { scopedDb } from "@/lib/auth/scoped-db";
import { gmailConfigured } from "@/lib/gmail/google";
import { isAiConfigured } from "@/lib/ai/client";

// A scan lists, fetches and classifies up to ~40 emails; give its server action room to finish.
export const maxDuration = 60;

const callbackMessages: Record<string, { tone: "ok" | "error"; text: string }> = {
  connected: { tone: "ok", text: "Gmail connected. Press Sync now to scan it." },
  cancelled: { tone: "error", text: "Gmail wasn't connected: the Google screen was cancelled." },
  failed: { tone: "error", text: "Gmail wasn't connected: that sign-in took too long or didn't match. Please try again." },
  scope: {
    tone: "error",
    text: "Gmail wasn't connected: GradPonto needs the \"Read your email\" permission. Try again and leave that box ticked.",
  },
  unavailable: { tone: "error", text: "Gmail sync isn't set up on this server yet (GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET)." },
};

export default async function AdminGmailPage({ searchParams }: { searchParams: Promise<{ gmail?: string }> }) {
  // Always the real admin, never an impersonated user — see lib/actions/gmail.ts.
  const admin = await requireAdmin();
  const db = scopedDb(admin.id);
  const { gmail } = await searchParams;

  const [connection, proposals] = await Promise.all([
    db.gmailConnection.findUnique({ where: { userId: admin.id }, select: { email: true, lastSyncedAt: true } }),
    db.gmailProposal.findMany({
      where: { state: "PENDING" },
      orderBy: { receivedAt: "desc" },
      include: { application: { include: { employer: true } } },
    }),
  ]);

  const views: ProposalView[] = proposals.map((proposal) => ({
    id: proposal.id,
    kind: proposal.kind,
    subject: proposal.subject,
    sender: proposal.sender,
    snippet: proposal.snippet,
    receivedAt: proposal.receivedAt.toISOString(),
    messageId: proposal.messageId,
    company: proposal.company,
    roleTitle: proposal.roleTitle,
    jobUrl: proposal.jobUrl,
    reference: proposal.reference,
    event: proposal.event,
    confidence: proposal.confidence,
    proposedStatus: proposal.proposedStatus,
    fromStatus: proposal.fromStatus,
    application: proposal.application
      ? {
          id: proposal.application.id,
          title: proposal.application.title,
          company: proposal.application.employer?.name ?? "",
          status: proposal.application.status,
        }
      : null,
  }));

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Sync from Gmail: suggested updates to your own applications, from your inbox. Nothing changes until you approve it."
      />
      <AdminTabs />

      {!gmailConfigured() ? (
        <EmptyState
          icon={Mail}
          title="Gmail sync isn't set up"
          description="Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to the environment (see README, “Sync from Gmail”), then redeploy."
        />
      ) : (
        <GmailSyncPanel
          connection={connection ? { email: connection.email, lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null } : null}
          proposals={views}
          aiConfigured={isAiConfigured()}
          notice={gmail ? (callbackMessages[gmail] ?? null) : null}
        />
      )}
    </div>
  );
}
