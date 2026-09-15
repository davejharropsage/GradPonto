import { Target } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalCard } from "@/components/goals/goal-card";
import { getGoalsWithProgress } from "@/lib/data/goals";

export default async function GoalsPage() {
  const goals = await getGoalsWithProgress();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Goals" description="Set a target and track it against your actual applications." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New goal</CardTitle>
        </CardHeader>
        <CardContent>
          <GoalForm />
        </CardContent>
      </Card>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Add one above, like 10 applications this month." />
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
