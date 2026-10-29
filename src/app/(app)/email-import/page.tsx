import { after } from "next/server";
import { MailX } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SetupCard } from "@/components/email-import/setup-card";
import { ReceivedEmails } from "@/components/email-import/received-emails";
import { SuggestionsPanel, type SuggestionView } from "@/components/email-import/suggestions-panel";
import { requireRegisteredUser } from "@/lib/auth/user";
import { getEmailImportOverview, getOrCreateInbox } from "@/lib/data/email-import";
import { gmailFilterQuery, gmailSearchUrl } from "@/lib/inbound/core";
import { inboundAddress, inboundConfigured } from "@/lib/inbound/config";
import { processInboundQueue } from "@/lib/inbound/process";
import { logError } from "@/lib/monitoring";

// "Process now" (and the automatic retry when the page opens) classify queued emails; give them room.
export const maxDuration = 60;

export default async function EmailImportPage() {
  if (!inboundConfigured()) {
    return (
      <div>
        <PageHeader title="Email import" />
        <EmptyState
          icon={MailX}
          title="Email import isn't switched on yet"
          description="It needs INBOUND_EMAIL_DOMAIN and INBOUND_WEBHOOK_SECRET (see README, “Email import”)."
        />
      </div>
    );
  }

  const user = await requireRegisteredUser();
  const inbox = await getOrCreateInbox();
  const { suggestions, waiting, received, recent } = await getEmailImportOverview();

  // Emails still waiting (the AI was busy when they arrived): retry in the background now, after the
  // page has been sent, rather than leaving it to the "Process" button or the daily schedule.
  if (waiting > 0) {
    after(async () => {
      try {
        await processInboundQueue(user.id);
      } catch (error) {
        logError("Email import page retry", error, { userId: user.id });
      }
    });
  }

  const views: SuggestionView[] = suggestions.map((suggestion) => ({
    id: suggestion.id,
    kind: suggestion.kind,
    subject: suggestion.subject,
    sender: suggestion.sender,
    snippet: suggestion.snippet,
    receivedAt: suggestion.receivedAt.toISOString(),
    gmailUrl: suggestion.originalMessageId ? gmailSearchUrl(suggestion.originalMessageId) : null,
    company: suggestion.company,
    roleTitle: suggestion.roleTitle,
    jobUrl: suggestion.jobUrl,
    reference: suggestion.reference,
    event: suggestion.event,
    confidence: suggestion.confidence,
    proposedStatus: suggestion.proposedStatus,
    application: suggestion.application
      ? {
          id: suggestion.application.id,
          title: suggestion.application.title,
          company: suggestion.application.employer?.name ?? "",
          status: suggestion.application.status,
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email import"
        description="Forward application emails to GradPonto and get suggested updates to your applications. Nothing changes until you approve it."
      />

      <SuggestionsPanel suggestions={views} waiting={waiting} />

      <SetupCard
        setup={{
          address: inboundAddress(inbox.token)!,
          userEmail: user.email,
          knownAddresses: inbox.knownAddresses,
          filterQuery: gmailFilterQuery(),
          forwarding: inbox.forwardingRequestedAt
            ? {
                code: inbox.forwardingCode,
                url: inbox.forwardingUrl,
                from: inbox.forwardingFrom,
                requestedAt: inbox.forwardingRequestedAt.toISOString(),
              }
            : null,
          lastReceivedAt: inbox.lastReceivedAt?.toISOString() ?? null,
          received,
        }}
      />

      <ReceivedEmails emails={recent} total={received} />
    </div>
  );
}
