import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DeadlineItem } from "@/components/applications/deadline-item";
import { getDeadlinesGrouped } from "@/lib/data/applications";

function GroupSection({
  title,
  dotColor,
  applications,
  columns = 2,
}: {
  title: string;
  dotColor: string;
  applications: Awaited<ReturnType<typeof getDeadlinesGrouped>>["overdue"];
  columns?: number;
}) {
  if (applications.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <h2 className="font-medium">{title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{applications.length}</span>
      </div>
      <div className={`grid grid-cols-1 gap-3 ${columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {applications.map((application) => (
          <DeadlineItem key={application.id} application={application} />
        ))}
      </div>
    </div>
  );
}

export default async function DeadlinesPage() {
  const { overdue, dueSoon, later } = await getDeadlinesGrouped();
  const isEmpty = overdue.length === 0 && dueSoon.length === 0 && later.length === 0;

  return (
    <div>
      <PageHeader title="Deadlines" />

      {isEmpty ? (
        <EmptyState icon={CalendarClock} title="No deadlines" description="Applications with a deadline will show up here." />
      ) : (
        <div className="space-y-8">
          <GroupSection title="Overdue" dotColor="bg-red-500" applications={overdue} />
          <GroupSection title="Due within 30 days" dotColor="bg-blue-500" applications={dueSoon} />
          <GroupSection title="Later" dotColor="bg-slate-400" applications={later} columns={3} />
        </div>
      )}
    </div>
  );
}
