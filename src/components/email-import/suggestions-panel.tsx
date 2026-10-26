"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ExternalLink, Inbox, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import {
  approveAllEmailSuggestions,
  approveEmailSuggestion,
  processEmailsNow,
  rejectEmailSuggestion,
} from "@/lib/actions/email-import";
import { applicationStatusColors, applicationStatusLabels, applicationStatuses } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SuggestionView {
  id: string;
  kind: "NEW_APPLICATION" | "STATUS_CHANGE";
  subject: string;
  sender: string;
  snippet: string;
  receivedAt: string;
  /** Link to find the original in Gmail, when it had a Message-ID. */
  gmailUrl: string | null;
  company: string;
  roleTitle: string;
  jobUrl: string | null;
  reference: string | null;
  event: string;
  confidence: number;
  proposedStatus: string;
  application: { id: string; title: string; company: string; status: string } | null;
}

interface Edits {
  company?: string;
  roleTitle?: string;
  jobUrl?: string;
  status?: (typeof applicationStatuses)[number];
}

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

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-4xl px-2 py-0.5 text-xs font-medium", applicationStatusColors[status])}>
      {applicationStatusLabels[status] ?? status}
    </span>
  );
}

export function SuggestionsPanel({ suggestions, waiting }: { suggestions: SuggestionView[]; waiting: number }) {
  const router = useRouter();
  const [processing, startProcessing] = useTransition();
  const [bulkPending, startBulk] = useTransition();
  const [edits, setEdits] = useState<Record<string, Edits>>({});
  const busy = processing || bulkPending;

  function processNow() {
    startProcessing(async () => {
      const result = await processEmailsNow();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { created, updated, remaining, error } = result.data;
      if (error) toast.error(error);
      else if (created + updated > 0) toast.success(`${created} new suggestion${created === 1 ? "" : "s"}${updated ? `, ${updated} updated` : ""}`);
      else toast.success(remaining ? "Some emails are still waiting — try again in a moment" : "No new suggestions");
      router.refresh();
    });
  }

  function approveAll() {
    startBulk(async () => {
      const result = await approveAllEmailSuggestions(edits);
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          Suggestions <span className="text-muted-foreground">({suggestions.length})</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {waiting > 0 && (
            <Button type="button" variant="outline" onClick={processNow} disabled={busy}>
              <RefreshCw className={cn("h-4 w-4", processing && "animate-spin")} />
              {processing ? "Reading emails..." : `Process ${waiting} waiting`}
            </Button>
          )}
          {suggestions.length > 0 && (
            <Button type="button" onClick={approveAll} disabled={busy}>
              <Check className="h-4 w-4" />
              {bulkPending ? "Applying..." : `Approve all (${suggestions.length})`}
            </Button>
          )}
        </div>
      </div>

      {suggestions.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing to review"
          description={
            waiting > 0
              ? "Some emails are still being read. They'll show up here in a moment."
              : "Forwarded application emails turn into suggestions here."
          }
        />
      ) : (
        suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            edits={edits[suggestion.id] ?? {}}
            onEdit={(next) => setEdits((all) => ({ ...all, [suggestion.id]: { ...all[suggestion.id], ...next } }))}
            disabled={busy}
            onDone={() => {
              setEdits((all) => {
                const rest = { ...all };
                delete rest[suggestion.id];
                return rest;
              });
              router.refresh();
            }}
          />
        ))
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  edits,
  onEdit,
  disabled,
  onDone,
}: {
  suggestion: SuggestionView;
  edits: Edits;
  onEdit: (edits: Edits) => void;
  disabled: boolean;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const companyId = useId();
  const roleId = useId();
  const urlId = useId();
  const status = edits.status ?? suggestion.proposedStatus;
  const isNew = suggestion.kind === "NEW_APPLICATION";
  const lowConfidence = suggestion.confidence < 0.6;

  function approve() {
    startTransition(async () => {
      const result = await approveEmailSuggestion(suggestion.id, edits);
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
      const result = await rejectEmailSuggestion(suggestion.id);
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
          <Badge variant="outline">{eventLabels[suggestion.event] ?? suggestion.event}</Badge>
          <Badge variant="outline" className={cn(lowConfidence && "border-amber-400 text-amber-700 dark:text-amber-400")}>
            {Math.round(suggestion.confidence * 100)}% sure
          </Badge>
          <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(suggestion.receivedAt)}</span>
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-sm">
          <p className="font-medium">{suggestion.subject}</p>
          <p className="text-xs text-muted-foreground">{suggestion.sender}</p>
          {suggestion.snippet && <p className="mt-1 line-clamp-2 text-muted-foreground">{suggestion.snippet}</p>}
          {suggestion.gmailUrl && (
            <a
              href={suggestion.gmailUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Find in Gmail <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {isNew ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={companyId}>Company</Label>
              <Input
                id={companyId}
                value={edits.company ?? suggestion.company}
                onChange={(e) => onEdit({ company: e.target.value })}
                maxLength={200}
                disabled={disabled || pending}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={roleId}>Role</Label>
              <Input
                id={roleId}
                value={edits.roleTitle ?? suggestion.roleTitle}
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
                value={edits.jobUrl ?? suggestion.jobUrl ?? ""}
                placeholder="Optional"
                onChange={(e) => onEdit({ jobUrl: e.target.value })}
                disabled={disabled || pending}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              {statusSelect}
            </div>
            {suggestion.reference && <p className="text-xs text-muted-foreground sm:col-span-2">Reference: {suggestion.reference}</p>}
          </div>
        ) : suggestion.application ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href={`/applications/${suggestion.application.id}`} className="font-medium hover:underline">
              {suggestion.application.company ? `${suggestion.application.company} · ` : ""}
              {suggestion.application.title}
            </Link>
            <StatusPill status={suggestion.application.status} />
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            {statusSelect}
          </div>
        ) : (
          <p className="text-sm text-destructive">The application this would update has been deleted. Reject this suggestion.</p>
        )}

        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={approve} disabled={disabled || pending || (!isNew && !suggestion.application)}>
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
