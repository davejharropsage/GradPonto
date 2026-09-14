import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { applicationStatusLabels, applicationStatusColors, priorityLabels, priorityColors } from "@/lib/labels";
import { formatDate, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Application, Employer } from "@/generated/prisma/client";

type ApplicationWithEmployer = Application & { employer: Employer | null };

export function DeadlineItem({ application }: { application: ApplicationWithEmployer }) {
  const overdue = isOverdue(application.deadline!);

  return (
    <Link
      href={`/applications/${application.id}`}
      className={cn(
        "block rounded-lg border p-4 transition-colors hover:bg-accent/40",
        overdue && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{application.employer?.name ?? "Unknown company"}</h3>
        {overdue && (
          <span className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Overdue
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">{application.title}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge className={applicationStatusColors[application.status]} variant="outline">
          {applicationStatusLabels[application.status]}
        </Badge>
        <Badge className={priorityColors[application.priority]} variant="outline">
          {priorityLabels[application.priority]}
        </Badge>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Deadline: {formatDate(application.deadline!)}
        {application.salary ? ` · ${application.salary}` : ""}
      </p>
    </Link>
  );
}
