"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { activityTypeLabels } from "@/lib/labels";
import { isOverdue } from "@/lib/format";
import { toggleActivityComplete } from "@/lib/actions/activities";
import { cn } from "@/lib/utils";
import type { Activity, Application, Employer } from "@/generated/prisma/client";

type ReminderWithApplication = Activity & {
  application: (Application & { employer: Employer | null }) | null;
};

export function UpcomingRemindersCard({ reminders }: { reminders: ReminderWithApplication[] }) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  if (reminders.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <CardTitle className="text-base">Reminders</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {reminders.map((reminder) => {
            const overdue = reminder.dueDate ? isOverdue(reminder.dueDate) : false;
            return (
              <li key={reminder.id} className="flex items-start gap-3 py-3">
                <Checkbox
                  className="mt-0.5"
                  onCheckedChange={(checked) => {
                    startTransition(async () => {
                      await toggleActivityComplete(reminder.id, checked === true);
                      router.refresh();
                    });
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{activityTypeLabels[reminder.type]}</Badge>
                    <span className="truncate text-sm font-medium">{reminder.subject}</span>
                  </div>
                  {reminder.application && (
                    <a
                      href={`/applications/${reminder.application.id}`}
                      className="mt-0.5 block truncate text-xs text-muted-foreground hover:underline"
                    >
                      {reminder.application.employer?.name ?? reminder.application.title}
                    </a>
                  )}
                </div>
                {reminder.dueDate && (
                  <span className={cn("shrink-0 text-xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                    {overdue ? "Overdue" : "Due"} {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(reminder.dueDate))}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
