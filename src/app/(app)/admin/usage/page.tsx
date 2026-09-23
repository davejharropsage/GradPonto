import { Gauge } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { getUsageToday } from "@/lib/data/admin";

export default async function AdminUsagePage() {
  const usage = await getUsageToday();
  const hasAnyData = usage.ai.today > 0 || usage.adzuna.today > 0;

  return (
    <div>
      <PageHeader title="Admin" description="How much of the shared free-tier allowance has been used." />
      <AdminTabs />

      {!hasAnyData ? (
        <EmptyState
          icon={Gauge}
          title="No usage recorded today"
          description="This only counts requests made since this dashboard shipped — it doesn't backfill anything from before."
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI (Gemini)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-semibold">{usage.ai.today}</p>
              <p className="text-xs text-muted-foreground">Requests today</p>
            </div>
            <div>
              <p className="text-lg font-medium">{usage.ai.lastHour}</p>
              <p className="text-xs text-muted-foreground">In the last hour, across all users (each person is capped at 30/hour)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job search (Adzuna)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-semibold">{usage.adzuna.today}</p>
              <p className="text-xs text-muted-foreground">Real searches today (cached repeats don&apos;t count)</p>
            </div>
            <div>
              <p className="text-lg font-medium">{usage.adzuna.lastHour}</p>
              <p className="text-xs text-muted-foreground">In the last hour, against Adzuna&apos;s shared daily/minute budget.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
