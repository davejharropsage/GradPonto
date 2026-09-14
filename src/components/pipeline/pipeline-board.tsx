"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PipelineCard } from "./pipeline-card";
import { updateApplicationStatus } from "@/lib/actions/applications";
import { applicationStatuses, applicationStatusLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Application, Employer } from "@/generated/prisma/client";

type ApplicationWithEmployer = Application & { employer: Employer | null };
type Groups = Record<string, ApplicationWithEmployer[]>;

const columnDotColors: Record<string, string> = {
  INTERESTED: "bg-slate-400",
  NOT_STARTED: "bg-slate-300",
  PREPARING: "bg-amber-500",
  APPLIED: "bg-blue-500",
  ONLINE_ASSESSMENT: "bg-purple-500",
  VIDEO_INTERVIEW: "bg-sky-500",
  OFFER: "bg-emerald-500",
  REJECTED: "bg-red-500",
  WITHDRAWN: "bg-gray-400",
};

export function PipelineBoard({ initialGroups }: { initialGroups: Groups }) {
  const [groups, setGroups] = useState(initialGroups);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const draggingId = useRef<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleDrop(status: string) {
    const id = draggingId.current;
    draggingId.current = null;
    setDragOverColumn(null);
    if (!id) return;

    setGroups((prev) => {
      let moved: ApplicationWithEmployer | undefined;
      const next: Groups = {};
      for (const key of Object.keys(prev)) {
        next[key] = prev[key].filter((app) => {
          if (app.id === id) {
            moved = app;
            return false;
          }
          return true;
        });
      }
      if (moved) next[status] = [{ ...moved, status: status as Application["status"] }, ...next[status]];
      return next;
    });

    startTransition(async () => {
      await updateApplicationStatus(id, status);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {applicationStatuses.map((status) => {
        const items = groups[status] ?? [];
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(status);
            }}
            onDragLeave={() => setDragOverColumn((current) => (current === status ? null : current))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(status);
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 p-3 transition-colors",
              dragOverColumn === status && "border-primary bg-accent"
            )}
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={cn("h-2 w-2 rounded-full", columnDotColors[status])} />
              <h3 className="text-sm font-medium">{applicationStatusLabels[status]}</h3>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {items.length}
              </span>
            </div>

            <div className="flex min-h-24 flex-col gap-2">
              {items.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-md border border-dashed py-6 text-xs text-muted-foreground">
                  Drop here
                </div>
              ) : (
                items.map((application) => (
                  <PipelineCard
                    key={application.id}
                    application={application}
                    onDragStart={(id) => (draggingId.current = id)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
