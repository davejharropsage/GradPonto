"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { priorityLabels, priorityColors } from "@/lib/labels";
import { daysUntil, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Application, Employer } from "@/generated/prisma/client";

export type ApplicationWithEmployer = Application & { employer: Employer | null };

/** What a card looks like. Shared by the card in the column and the "lifted" copy that follows the pointer. */
export function PipelineCardBody({
  application,
  lifted = false,
  placeholder = false,
}: {
  application: ApplicationWithEmployer;
  /** The copy that is being carried: raised, tilted and shadowed so it reads as picked up. */
  lifted?: boolean;
  /** The empty spot left behind in the column while the card is being carried. */
  placeholder?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border bg-card p-3 shadow-sm transition-shadow",
        lifted && "rotate-[2.5deg] scale-[1.04] cursor-grabbing border-primary/40 shadow-2xl ring-2 ring-primary/20",
        placeholder && "border-dashed opacity-40"
      )}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
        <div className="min-w-0 flex-1">
          <Link href={`/applications/${application.id}`} className="block truncate font-medium hover:underline" draggable={false}>
            {application.employer?.name ?? "Unknown company"}
          </Link>
          <p className="line-clamp-2 text-sm text-muted-foreground">{application.title}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className={priorityColors[application.priority]} variant="outline">
          {priorityLabels[application.priority]}
        </Badge>
        {application.deadline && (
          <Badge variant="outline" className={isOverdue(application.deadline) ? "border-red-300 text-red-600 dark:text-red-400" : ""}>
            {isOverdue(application.deadline) ? "Overdue" : `${daysUntil(application.deadline)} days left`}
          </Badge>
        )}
      </div>

      {application.location && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {application.location}
        </div>
      )}
    </div>
  );
}

/** A card you can pick up: with the mouse, by touch (press and hold), or from the keyboard (Space, arrows, Space). */
export function PipelineCard({ application }: { application: ApplicationWithEmployer }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: application.id,
    data: { application },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-application-id={application.id}
      className="cursor-grab touch-manipulation rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:cursor-grabbing"
    >
      <PipelineCardBody application={application} placeholder={isDragging} />
    </div>
  );
}
