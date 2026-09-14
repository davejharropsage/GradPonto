"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { priorityLabels, priorityColors } from "@/lib/labels";
import { daysUntil, isOverdue } from "@/lib/format";
import type { Application, Employer } from "@/generated/prisma/client";

type ApplicationWithEmployer = Application & { employer: Employer | null };

export function PipelineCard({
  application,
  onDragStart,
}: {
  application: ApplicationWithEmployer;
  onDragStart: (id: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(application.id);
      }}
      className="cursor-grab space-y-2 rounded-lg border bg-card p-3 shadow-sm active:cursor-grabbing"
    >
      <Link href={`/applications/${application.id}`} className="block font-medium hover:underline">
        {application.employer?.name ?? "Unknown company"}
      </Link>
      <p className="line-clamp-1 text-sm text-muted-foreground">{application.title}</p>

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
