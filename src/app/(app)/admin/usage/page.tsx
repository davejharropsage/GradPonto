import { Gauge } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { getUsageToday } from "@/lib/data/admin";

const meterLabels: Record<string, { title: string; unit: string }> = {
  AI: { title: "AI (Claude)", unit: "Requests" },
  ADZUNA: { title: "Job search (Adzuna)", unit: "Real searches (cached repeats don't count)" },
  MAIL: { title: "Emails sent (SMTP)", unit: "Sign-up, reset and welcome emails" },
  INBOUND: { title: "Emails received (Email import)", unit: "Forwarded emails" },
};

export default async function AdminUsagePage() {
  const usage = await getUsageToday();
  const hasAnyData = usage.some((meter) => meter.today > 0);

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
        {usage.map((meter) => {
          const label = meterLabels[meter.kind];
          const nearLimit = meter.today >= meter.limit * 0.8;
          return (
            <Card key={meter.kind}>
              <CardHeader>
                <CardTitle className="text-base">{label.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-semibold">
                    {meter.today}
                    <span className={nearLimit ? "text-base text-destructive" : "text-base text-muted-foreground"}> / {meter.limit}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {label.unit} today (UTC), against the daily cap <code>{meter.limitEnv}</code>
                    {meter.perUserLimit ? `; ${meter.perUserLimit} per person` : ""}. At the cap, requests are refused until midnight UTC and
                    you get an alert email.
                  </p>
                </div>
                <div>
                  <p className="text-lg font-medium">{meter.lastHour}</p>
                  <p className="text-xs text-muted-foreground">In the last hour</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
