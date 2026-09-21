import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GreetingBanner } from "@/components/dashboard/greeting-banner";
import { StatCards } from "@/components/dashboard/stat-cards";
import { NeedsAttentionTable } from "@/components/dashboard/needs-attention-table";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { StaleApplicationsCard } from "@/components/dashboard/stale-applications-card";
import { UpcomingRemindersCard } from "@/components/dashboard/upcoming-reminders-card";
import {
  getDashboardStats,
  getProgressBuckets,
  getNeedsAttention,
  getUpcomingDeadlines,
  getStaleApplications,
  getUpcomingReminders,
} from "@/lib/data/dashboard";
import { getProfile, getGreeting } from "@/lib/data/profile";
import { userDb } from "@/lib/auth/user";
import { formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const db = await userDb();

  const [
    stats,
    buckets,
    needsAttention,
    upcomingDeadlines,
    staleApplications,
    upcomingReminders,
    profile,
    applicationsThisWeek,
  ] = await Promise.all([
    getDashboardStats(),
    getProgressBuckets(),
    getNeedsAttention(),
    getUpcomingDeadlines(4),
    getStaleApplications(),
    getUpcomingReminders(),
    getProfile(),
    db.application.count({ where: { createdAt: { gte: startOfWeek } } }),
  ]);

  const statCards = [
    { label: "Applications", value: stats.applications },
    { label: "Assessments", value: stats.assessments },
    { label: "Interviews", value: stats.interviews },
    { label: "Offers", value: stats.offers },
    { label: "Deadlines", value: stats.deadlinesSoon },
  ];

  return (
    <div className="space-y-6">
      <GreetingBanner greeting={getGreeting()} name={profile.name} applicationsThisWeek={applicationsThisWeek} />

      <StatCards stats={statCards} />

      <NeedsAttentionTable rows={needsAttention} />

      <UpcomingRemindersCard reminders={upcomingReminders} />

      <StaleApplicationsCard applications={staleApplications} />

      <ProgressBar buckets={buckets} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
          </div>
          <a href="/deadlines" className="text-sm text-muted-foreground hover:text-foreground">
            View all →
          </a>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No deadlines in the next 7 days. You&apos;re on track.</p>
          ) : (
            <ul className="divide-y">
              {upcomingDeadlines.map((application) => (
                <li key={application.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <a href={`/applications/${application.id}`} className="truncate text-sm font-medium hover:underline">
                      {application.employer?.name ?? application.title}
                    </a>
                    <p className="truncate text-xs text-muted-foreground">{application.title}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(application.deadline!)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
