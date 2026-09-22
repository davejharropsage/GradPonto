"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { priorityLabels } from "@/lib/labels";
import { daysUntil, isOverdue } from "@/lib/format";
import type { ApplicationWithEmployer } from "./pipeline-card";

export type DeadlineWindow = "ALL" | "OVERDUE" | "NEXT_7" | "NEXT_30" | "NONE";

const deadlineWindowLabels: Record<DeadlineWindow, string> = {
  ALL: "Any deadline",
  OVERDUE: "Overdue",
  NEXT_7: "Next 7 days",
  NEXT_30: "Next 30 days",
  NONE: "No deadline",
};

export interface PipelineFilterState {
  priority: "ALL" | "LOW" | "MEDIUM" | "HIGH";
  deadline: DeadlineWindow;
  employerId: string;
}

export const defaultPipelineFilters: PipelineFilterState = {
  priority: "ALL",
  deadline: "ALL",
  employerId: "ALL",
};

export function matchesDeadlineWindow(deadline: Date | null, window: DeadlineWindow): boolean {
  if (window === "ALL") return true;
  if (window === "NONE") return !deadline;
  if (!deadline) return false;
  if (window === "OVERDUE") return isOverdue(deadline);
  const days = daysUntil(deadline);
  if (window === "NEXT_7") return days >= 0 && days <= 7;
  return days >= 0 && days <= 30;
}

export function matchesPipelineFilters(application: ApplicationWithEmployer, filters: PipelineFilterState): boolean {
  if (filters.priority !== "ALL" && application.priority !== filters.priority) return false;
  if (filters.employerId !== "ALL" && application.employerId !== filters.employerId) return false;
  return matchesDeadlineWindow(application.deadline, filters.deadline);
}

export function PipelineFilters({
  filters,
  onChange,
  employers,
}: {
  filters: PipelineFilterState;
  onChange: (next: PipelineFilterState) => void;
  employers: { id: string; name: string }[];
}) {
  const isActive =
    filters.priority !== "ALL" || filters.deadline !== "ALL" || filters.employerId !== "ALL";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Select
        value={filters.priority}
        onValueChange={(v) => onChange({ ...filters, priority: (v ?? "ALL") as PipelineFilterState["priority"] })}
      >
        <SelectTrigger size="sm">
          <SelectValue>
            {(value: string) => (value === "ALL" ? "Any priority" : priorityLabels[value])}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Any priority</SelectItem>
          <SelectItem value="LOW">{priorityLabels.LOW}</SelectItem>
          <SelectItem value="MEDIUM">{priorityLabels.MEDIUM}</SelectItem>
          <SelectItem value="HIGH">{priorityLabels.HIGH}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.deadline}
        onValueChange={(v) => onChange({ ...filters, deadline: (v ?? "ALL") as DeadlineWindow })}
      >
        <SelectTrigger size="sm">
          <SelectValue>{(value: string) => deadlineWindowLabels[value as DeadlineWindow]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(deadlineWindowLabels) as DeadlineWindow[]).map((key) => (
            <SelectItem key={key} value={key}>
              {deadlineWindowLabels[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {employers.length > 0 && (
        <Select
          value={filters.employerId}
          onValueChange={(v) => onChange({ ...filters, employerId: v ?? "ALL" })}
        >
          <SelectTrigger size="sm">
            <SelectValue>
              {(value: string) => (value === "ALL" ? "Any company" : (employers.find((e) => e.id === value)?.name ?? value))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any company</SelectItem>
            {employers.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {isActive && (
        <Button variant="ghost" size="sm" onClick={() => onChange(defaultPipelineFilters)}>
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
