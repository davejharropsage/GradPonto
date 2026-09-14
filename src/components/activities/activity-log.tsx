import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ClipboardList } from "lucide-react";
import { activityTypeLabels } from "@/lib/labels";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { ActivityForm } from "./activity-form";
import type { Activity } from "@/generated/prisma/client";

export function ActivityLog({
  activities,
  applicationId,
}: {
  activities: Activity[];
  applicationId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ActivityForm applicationId={applicationId} />

        {activities.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No activity yet" description="Log an interview, task, follow-up, or note above." />
        ) : (
          <ul className="divide-y">
            {activities.map((activity) => (
              <li key={activity.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{activityTypeLabels[activity.type]}</Badge>
                    <span className="text-sm font-medium">{activity.subject}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
                {activity.notes && <p className="mt-1 text-sm text-muted-foreground">{activity.notes}</p>}
                {activity.dueDate && (
                  <p className="mt-1 text-xs text-muted-foreground">Due {formatDate(activity.dueDate)}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
