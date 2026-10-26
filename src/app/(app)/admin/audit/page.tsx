import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminTabs } from "@/components/admin/admin-tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuditLog } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";

const actionLabels: Record<string, string> = {
  "user.suspend": "Suspended user",
  "user.reinstate": "Reinstated user",
  "user.impersonate_start": "Started impersonating",
  "user.impersonate_stop": "Stopped impersonating",
};

export default async function AdminAuditPage() {
  const entries = await getAuditLog();

  return (
    <div>
      <PageHeader title="Admin" description="Who did what, when." />
      <AdminTabs />

      {entries.length === 0 ? (
        <EmptyState icon={History} title="No admin actions yet" description="Suspending, reinstating or impersonating a user will show up here." />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(entry.createdAt)}</TableCell>
                  <TableCell>{entry.actorEmail}</TableCell>
                  <TableCell>{actionLabels[entry.action] ?? entry.action}</TableCell>
                  <TableCell>{entry.targetEmail ?? <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.detail ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
