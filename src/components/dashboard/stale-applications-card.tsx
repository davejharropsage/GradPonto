import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";
import type { Application, Employer } from "@/generated/prisma/client";

type ApplicationWithEmployer = Application & { employer: Employer | null };

export function StaleApplicationsCard({ applications }: { applications: ApplicationWithEmployer[] }) {
  if (applications.length === 0) return null;

  return (
    <Card className="border-amber-300/60 dark:border-amber-900">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <Clock3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <CardTitle className="text-base">Going Stale</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          Sitting untouched for two weeks or more. Still worth a decision either way.
        </p>
        <ul className="divide-y">
          {applications.map((application) => (
            <li key={application.id} className="flex items-center justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <Link href={`/applications/${application.id}`} className="truncate text-sm font-medium hover:underline">
                  {application.employer?.name ?? application.title}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{application.title}</p>
              </div>
              <span className="shrink-0 text-xs text-amber-700 dark:text-amber-400">
                Updated {formatRelativeTime(application.updatedAt)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
