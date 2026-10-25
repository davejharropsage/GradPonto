"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ExternalLink, Inbox, Mail, RefreshCw, Unplug, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import {
  approveAllGmailProposals,
  approveGmailProposal,
  disconnectGmail,
  rejectGmailProposal,
  syncGmailNow,
} from "@/lib/actions/gmail";
import { applicationStatusColors, applicationStatusLabels, applicationStatuses } from "@/lib/labels";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ProposalView {
  id: string;
  kind: "NEW_APPLICATION" | "STATUS_CHANGE";
  subject: string;
  sender: string;
  snippet: string;
  receivedAt: string;
  messageId: string;
  company: string;
  roleTitle: string;
  jobUrl: string | null;
  reference: string | null;
  event: string;
  confidence: number;
  proposedStatus: string;
  fromStatus: string | null;
  application: { id: string; title: string; company: string; status: string } | null;
}

interface Edits {
  company?: string;
  roleTitle?: string;
  jobUrl?: string;
  status?: (typeof applicationStatuses)[number];
}

type SyncSummary = Extract<Awaited<ReturnType<typeof syncGmailNow>>, { ok: true }>["data"];

const eventLabels: Record<string, string> = {
  applied: "Application received",
  online_assessment: "Online assessment",
  video_interview: "Video interview",
  interview: "Interview",
  assessment_centre: "Assessment centre",
  offer: "Offer",
  rejected: "Rejection",
  withdrawn: "Withdrawal",
};

const skipLabels: Record<string, string> = {
  "not-addressed-to-you": "not addressed to you",
  newsletter: "job-board newsletters",
  "job-alert": "job alerts",
  "no-application-keywords": "not about an application",
};

function gmailLink(mailbox: string, messageId: string) {
  return `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(mailbox)}#all/${encodeURIComponent(messageId)}`;
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-4xl px-2 py-0.5 text-xs font-medium", applicationStatusColors[status])}>
      {applicationStatusLabels[status] ?? status}
    </span>
  );
}

export function GmailSyncPanel({
  connection,
  proposals,
  aiConfigured,
  notice,
}: {
  connection: { email: string; lastSyncedAt: string | null } | null;
  proposals: ProposalView[];
  aiConfigured: boolean;
  notice: { tone: "ok" | "error"; text: string } | null;
}) {
  const router = useRouter();
  const [syncing, startSync] = useTransition();
  const [bulkPending, startBulk] = useTransition();
  const [disconnecting, startDisconnect] = useTransition();
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [edits, setEdits] = useState<Record<string, Edits>>({});

  function sync() {
    startSync(async () => {
      const result = await syncGmailNow();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSummary(result.data);
      const { proposalsCreated, proposalsUpdated } = result.data;
      toast.success(
        proposalsCreated + proposalsUpdated > 0
          ? `${proposalsCreated} new suggestion${proposalsCreated === 1 ? "" : "s"}${proposalsUpdated ? `, ${proposalsUpdated} updated` : ""}`
          : "No new suggestions"
      );
      router.refresh();
    });
  }

  function approveAll() {
    startBulk(async () => {
      const result = await approveAllGmailProposals(edits);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { approved, failed } = result.data;
      if (failed.length > 0) toast.error(`${failed.length} couldn't be applied: ${failed[0].error}`);
      if (approved > 0) toast.success(`Applied ${approved} suggestion${approved === 1 ? "" : "s"}`);
      setEdits({});
      router.refresh();
    });
  }

  function disconnect() {
    if (!window.confirm("Disconnect Gmail? GradPonto will stop reading this mailbox. Pending suggestions are kept.")) return;
    startDisconnect(async () => {
      const result = await disconnectGmail();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Gmail disconnected");
      setSummary(null);
      router.refresh();
    });
  }

  const busy = syncing || bulkPending || disconnecting;

  return (
    <div className="space-y-6">
      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            notice.tone === "error"
              ? "border-destructive/40 text-destructive"
              : "border-emerald-300 text-emerald-700 dark:text-emerald-400"
          )}
        >
          {notice.text}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Gmail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {connection ? (
            <>
              <p className="text-sm">
                Connected as <span className="font-medium">{connection.email}</span> (read-only).{" "}
                <span className="text-muted-foreground">
                  {connection.lastSyncedAt
                    ? `Last synced ${formatRelativeTime(connection.lastSyncedAt)}.`
                    : "Not synced yet: the first sync looks back 90 days."}
                </span>
              </p>
              {!aiConfigured && (
                <p className="text-sm text-destructive">No AI key is set (GEMINI_API_KEY), so emails can&apos;t be classified yet.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={sync} disabled={busy || !aiConfigured}>
                  <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                  {syncing ? "Scanning your inbox..." : "Sync now"}
                </Button>
                <a href="/api/gmail/connect" className={buttonVariants({ variant: "outline" })}>
                  Reconnect
                </a>
                <Button type="button" variant="ghost" onClick={disconnect} disabled={busy}>
                  <Unplug className="h-4 w-4" />
                  Disconnect
                </Button>
              </div>
              {summary && <SyncSummaryLine summary={summary} />}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Connect your Gmail to find application emails (confirmations, tests, interviews, offers, rejections) and
                turn them into suggested updates. GradPonto only asks for read-only access, and job alerts, newsletters
                and mail not addressed to you are ignored.
              </p>
              {/* A plain link, not next/link: this route handler sends the browser off to Google. */}
              <a href="/api/gmail/connect" className={buttonVariants()}>
                <Mail className="h-4 w-4" />
                Connect Gmail
              </a>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Suggestions <span className="text-muted-foreground">({proposals.length})</span>
          </h2>
          {proposals.length > 0 && (
            <Button type="button" onClick={approveAll} disabled={busy}>
              <Check className="h-4 w-4" />
              {bulkPending ? "Applying..." : `Approve all (${proposals.length})`}
            </Button>
          )}
        </div>

        {proposals.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nothing to review"
            description={connection ? "Run a sync to look for new application emails." : "Connect Gmail to get started."}
          />
        ) : (
          proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              mailbox={connection?.email ?? ""}
              edits={edits[proposal.id] ?? {}}
              onEdit={(next) => setEdits((all) => ({ ...all, [proposal.id]: { ...all[proposal.id], ...next } }))}
              disabled={busy}
              onDone={() => {
                setEdits((all) => {
                  const rest = { ...all };
                  delete rest[proposal.id];
                  return rest;
                });
                router.refresh();
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SyncSummaryLine({ summary }: { summary: SyncSummary }) {
  const skipped = Object.entries(summary.skipped)
    .filter(([, count]) => count)
    .map(([reason, count]) => `${count} ${skipLabels[reason] ?? reason}`);
  return (
    <p className="text-sm text-muted-foreground">
      Looked at {summary.listed} matching email{summary.listed === 1 ? "" : "s"}
      {summary.alreadyProcessed ? ` (${summary.alreadyProcessed} seen before)` : ""}. Classified {summary.classified}
      {skipped.length ? `; skipped ${skipped.join(", ")}` : ""}.
      {summary.more && <span className="font-medium text-foreground"> There&apos;s more to scan: press Sync now again.</span>}
    </p>
  );
}

function ProposalCard({
  proposal,
  mailbox,
  edits,
  onEdit,
  disabled,
  onDone,
}: {
  proposal: ProposalView;
  mailbox: string;
  edits: Edits;
  onEdit: (edits: Edits) => void;
  disabled: boolean;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const companyId = useId();
  const roleId = useId();
  const urlId = useId();
  const status = edits.status ?? proposal.proposedStatus;
  const isNew = proposal.kind === "NEW_APPLICATION";
  const lowConfidence = proposal.confidence < 0.6;

  function approve() {
    startTransition(async () => {
      const result = await approveGmailProposal(proposal.id, edits);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isNew ? "Application added" : "Application updated");
      onDone();
    });
  }

  function reject() {
    startTransition(async () => {
      const result = await rejectGmailProposal(proposal.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onDone();
    });
  }

  const statusSelect = (
    <Select value={status} onValueChange={(next) => next && onEdit({ status: next as Edits["status"] })} disabled={disabled || pending}>
      <SelectTrigger size="sm" className="w-fit" aria-label="Status to set">
        <SelectValue>{(value: string) => applicationStatusLabels[value] ?? value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {applicationStatuses.map((value) => (
          <SelectItem key={value} value={value}>
            {applicationStatusLabels[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Card className={cn(pending && "opacity-60")}>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isNew ? "default" : "secondary"}>{isNew ? "New application" : "Status change"}</Badge>
          <Badge variant="outline">{eventLabels[proposal.event] ?? proposal.event}</Badge>
          <Badge variant="outline" className={cn(lowConfidence && "border-amber-400 text-amber-700 dark:text-amber-400")}>
            {Math.round(proposal.confidence * 100)}% sure
          </Badge>
          <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(proposal.receivedAt)}</span>
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-sm">
          <p className="font-medium">{proposal.subject}</p>
          <p className="text-xs text-muted-foreground">{proposal.sender}</p>
          {proposal.snippet && <p className="mt-1 line-clamp-2 text-muted-foreground">{proposal.snippet}</p>}
          <a
            href={gmailLink(mailbox, proposal.messageId)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open in Gmail <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {isNew ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={companyId}>Company</Label>
              <Input
                id={companyId}
                value={edits.company ?? proposal.company}
                onChange={(e) => onEdit({ company: e.target.value })}
                maxLength={200}
                disabled={disabled || pending}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={roleId}>Role</Label>
              <Input
                id={roleId}
                value={edits.roleTitle ?? proposal.roleTitle}
                placeholder="Untitled role"
                onChange={(e) => onEdit({ roleTitle: e.target.value })}
                maxLength={200}
                disabled={disabled || pending}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={urlId}>Job URL</Label>
              <Input
                id={urlId}
                type="url"
                value={edits.jobUrl ?? proposal.jobUrl ?? ""}
                placeholder="Optional"
                onChange={(e) => onEdit({ jobUrl: e.target.value })}
                disabled={disabled || pending}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              {statusSelect}
            </div>
            {proposal.reference && <p className="text-xs text-muted-foreground sm:col-span-2">Reference: {proposal.reference}</p>}
          </div>
        ) : proposal.application ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href={`/applications/${proposal.application.id}`} className="font-medium hover:underline">
              {proposal.application.company ? `${proposal.application.company} · ` : ""}
              {proposal.application.title}
            </Link>
            <StatusPill status={proposal.application.status} />
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            {statusSelect}
          </div>
        ) : (
          <p className="text-sm text-destructive">The application this would update has been deleted. Reject this suggestion.</p>
        )}

        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={approve} disabled={disabled || pending || (!isNew && !proposal.application)}>
            <Check className="h-4 w-4" />
            Approve
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={reject} disabled={disabled || pending}>
            <X className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
