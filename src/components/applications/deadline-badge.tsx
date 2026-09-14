import { formatDate, daysUntil, isOverdue } from "@/lib/format";

export function DeadlineBadge({ deadline }: { deadline: Date | string }) {
  const overdue = isOverdue(deadline);
  const days = daysUntil(deadline);

  return (
    <span className={`flex items-center gap-1.5 text-sm ${overdue ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${overdue ? "bg-red-500" : "bg-slate-400"}`} />
      {overdue ? "Overdue" : `${days} day${days === 1 ? "" : "s"} left`}
      <span className="text-muted-foreground">· {formatDate(deadline)}</span>
    </span>
  );
}
