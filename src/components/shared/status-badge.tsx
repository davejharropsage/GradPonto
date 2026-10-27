import { Badge } from "@/components/ui/badge";
import { applicationStatusDotColors, applicationStatusLabels, priorityDotColors, priorityLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** The small coloured dot that carries a status or priority's colour inside a neutral pill. */
export function ColorDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", className)} />;
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline">
      <ColorDot className={applicationStatusDotColors[status]} />
      {applicationStatusLabels[status] ?? status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant="outline">
      <ColorDot className={priorityDotColors[priority]} />
      {priorityLabels[priority] ?? priority}
    </Badge>
  );
}
