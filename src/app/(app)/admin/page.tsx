import { PageHeader } from "@/components/shared/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { SuspendUserButton } from "@/components/admin/suspend-user-button";
import { ImpersonateButton } from "@/components/admin/impersonate-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminOverview, getAdminUserList } from "@/lib/data/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDate, formatRelativeTime } from "@/lib/format";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [overview, users] = await Promise.all([getAdminOverview(), getAdminUserList()]);

  return (
    <div>
      <PageHeader title="Admin" description="Everyone with a GradPonto account." />
      <AdminTabs />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total users</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{overview.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Signups today</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{overview.today}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Signups this week</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{overview.thisWeek}</CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name ?? <span className="text-muted-foreground">-</span>}
                  {user.role === "ADMIN" && (
                    <Badge variant="outline" className="ml-2">
                      Admin
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.university ?? <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell className="whitespace-nowrap">{user.registeredAt ? formatDate(user.registeredAt) : "-"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>{user._count.applications}</TableCell>
                <TableCell>
                  {user.suspendedAt ? (
                    <Badge variant="outline" className="border-red-300 text-red-600 dark:text-red-400">
                      Suspended
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-600 dark:text-emerald-400">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {user.role !== "ADMIN" && user.id !== admin.id && !user.suspendedAt && (
                      <ImpersonateButton userId={user.id} />
                    )}
                    <SuspendUserButton
                      userId={user.id}
                      email={user.email}
                      suspended={Boolean(user.suspendedAt)}
                      isSelf={user.id === admin.id}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
