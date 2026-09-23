"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineDeleteButton } from "@/components/shared/inline-delete-button";
import { ClipboardList, MapPin, CalendarPlus } from "lucide-react";
import { activityTypeLabels } from "@/lib/labels";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { deleteActivity } from "@/lib/actions/activities";
import { ActivityForm } from "./activity-form";
import { EditActivityDialog } from "./edit-activity-dialog";
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
            {activities.map((activity) => {
              const editable = activity.type !== "STATUS_CHANGE";
              return (
                <li key={activity.id} className="group py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{activityTypeLabels[activity.type]}</Badge>
                      <span className="text-sm font-medium">{activity.subject}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {editable && (
                        <span className="hidden items-center gap-0.5 text-muted-foreground group-hover:flex">
                          <EditActivityDialog activity={activity} />
                          <InlineDeleteButton action={deleteActivity.bind(null, activity.id)} label="Delete this activity" />
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(activity.createdAt)}</span>
                    </div>
                  </div>
                  {activity.notes && <p className="mt-1 text-sm text-muted-foreground">{activity.notes}</p>}
                  {activity.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {activity.location}
                    </p>
                  )}
                  {activity.dueDate && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      Due {formatDateTime(activity.dueDate)}
                      <a
                        href={`/api/activities/${activity.id}/ics`}
                        className="inline-flex items-center gap-0.5 text-primary hover:underline"
                      >
                        <CalendarPlus className="h-3 w-3" />
                        Add to calendar
                      </a>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
