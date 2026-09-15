"use client";

import Link from "next/link";
import { Pencil, MapPin, PoundSterling, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DeadlineBadge } from "./deadline-badge";
import { StatusQuickSelect } from "./status-quick-select";
import { InlineDeleteButton } from "@/components/shared/inline-delete-button";
import { deleteApplication } from "@/lib/actions/applications";
import { priorityLabels, priorityColors } from "@/lib/labels";
import type { Application, Employer } from "@/generated/prisma/client";

type ApplicationWithEmployer = Application & { employer: Employer | null };

export function ApplicationCard({
  application,
  selected = false,
  onToggleSelect,
}: {
  application: ApplicationWithEmployer;
  selected?: boolean;
  onToggleSelect?: (id: string, checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Checkbox
            className="mt-1"
            checked={selected}
            onCheckedChange={(checked) => onToggleSelect?.(application.id, checked)}
            aria-label={`Select ${application.employer?.name ?? application.title}`}
          />
          <div>
            <Link href={`/applications/${application.id}`} className="font-semibold hover:underline">
              {application.employer?.name ?? "Unknown company"}
            </Link>
            <p className="text-sm text-muted-foreground">{application.title}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
          <Link href={`/applications/${application.id}/edit`} className="rounded p-1 hover:bg-accent hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <InlineDeleteButton action={deleteApplication.bind(null, application.id)} label="Delete this application" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <StatusQuickSelect applicationId={application.id} status={application.status} />
        <Badge className={priorityColors[application.priority]} variant="outline">
          {priorityLabels[application.priority]}
        </Badge>
      </div>

      <div className="space-y-1.5 text-sm text-muted-foreground">
        {application.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {application.location}
          </div>
        )}
        {application.salary && (
          <div className="flex items-center gap-1.5">
            <PoundSterling className="h-3.5 w-3.5" />
            {application.salary}
          </div>
        )}
        {application.deadline && <DeadlineBadge deadline={application.deadline} />}
      </div>

      {application.jobUrl && (
        <a
          href={application.jobUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open application
        </a>
      )}
    </div>
  );
}
