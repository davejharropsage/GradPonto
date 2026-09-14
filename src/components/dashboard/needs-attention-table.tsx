import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { priorityDotColors } from "@/lib/labels";
import type { Application, Employer } from "@/generated/prisma/client";

type Row = Application & { employer: Employer | null; nextAction: string };

export function NeedsAttentionTable({ rows }: { rows: Row[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <AlertCircle className="h-4 w-4" />
        <CardTitle className="text-base">Needs Attention</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState icon={AlertCircle} title="Nothing needs attention" description="You're all caught up." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="w-8 pb-2 font-normal"></th>
                    <th className="pb-2 font-normal">Company</th>
                    <th className="pb-2 font-normal">Role</th>
                    <th className="pb-2 font-normal">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-3">
                        <span className={`inline-block h-2 w-2 rounded-full ${priorityDotColors[row.priority]}`} />
                      </td>
                      <td className="py-3 font-medium">
                        <Link href={`/applications/${row.id}`} className="hover:underline">
                          {row.employer?.name ?? "—"}
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground">{row.title}</td>
                      <td className="py-3">
                        <Link href={`/applications/${row.id}`} className="text-primary hover:underline">
                          {row.nextAction}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link href="/applications" className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              View all applications →
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
