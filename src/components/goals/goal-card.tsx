import { Badge } from "@/components/ui/badge";
import { InlineDeleteButton } from "@/components/shared/inline-delete-button";
import { deleteGoal } from "@/lib/actions/goals";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function GoalCard({
  goal,
}: {
  goal: { id: string; target: number; startDate: Date; endDate: Date; progress: number };
}) {
  const pct = Math.min(100, Math.round((goal.progress / goal.target) * 100));
  const met = goal.progress >= goal.target;
  const now = new Date();
  const isCurrent = now >= goal.startDate && now <= goal.endDate;
  const isPast = now > goal.endDate;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">
            {goal.progress} / {goal.target} applications
          </p>
          {met && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" variant="outline">
              Met
            </Badge>
          )}
          {isPast && !met && <Badge variant="outline">Ended</Badge>}
          {isCurrent && (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" variant="outline">
              In progress
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDate(goal.startDate)} to {formatDate(goal.endDate)}
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", met ? "bg-primary" : "bg-primary/60")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <InlineDeleteButton action={deleteGoal.bind(null, goal.id)} label="Delete this goal" />
    </div>
  );
}
