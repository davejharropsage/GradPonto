import Link from "next/link";
import { FileText, CalendarClock, MessageSquare, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getDashboardStats,
  getUpcomingDeadlines,
  getRecentActivity,
  getRecentApplications,
} from "@/lib/data/dashboard";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { activityTypeLabels, applicationStatusLabels, applicationStatusVariants } from "@/lib/labels";

export default async function DashboardPage() {
  const [stats, upcomingDeadlines, recentActivity, recentApplications] = await Promise.all([
    getDashboardStats(),
    getUpcomingDeadlines(),
    getRecentActivity(),
    getRecentApplications(),
  ]);

  const statCards = [
    { label: "Total Applications", value: stats.total, icon: FileText, href: "/applications" },
    { label: "Open Applications", value: stats.openApplications, icon: CalendarClock, href: "/applications" },
    { label: "Interviews", value: stats.interviews, icon: MessageSquare, href: "/applications?status=INTERVIEW" },
    { label: "Offers", value: stats.offers, icon: Trophy, href: "/applications?status=OFFER" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="An overview of your placement applications." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <EmptyState icon={CalendarClock} title="No upcoming deadlines" description="Applications with a deadline will show up here." />
            ) : (
              <ul className="divide-y">
                {upcomingDeadlines.map((application) => (
                  <li key={application.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <Link href={`/applications/${application.id}`} className="truncate text-sm font-medium hover:underline">
                        {application.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {application.employer?.name || "No employer"}
                      </p>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No activity yet" description="Status changes, tasks, and notes will show up here." />
            ) : (
              <ul className="divide-y">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{activity.subject}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {activity.application?.title || "Unlinked"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary">{activityTypeLabels[activity.type]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recently Added Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <EmptyState icon={FileText} title="No applications yet" description="Add your first placement opportunity to get started." />
            ) : (
              <ul className="divide-y">
                {recentApplications.map((application) => (
                  <li key={application.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <Link href={`/applications/${application.id}`} className="truncate text-sm font-medium hover:underline">
                        {application.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {application.employer?.name || "No employer"}
                      </p>
                    </div>
                    <Badge variant={applicationStatusVariants[application.status]}>
                      {applicationStatusLabels[application.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
