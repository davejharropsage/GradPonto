import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { applicationStatusLabels, applicationStatusVariants } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { Application, Employer } from "@/generated/prisma/client";

type ApplicationWithEmployer = Application & { employer: Employer | null };

export function ApplicationsTable({ applications }: { applications: ApplicationWithEmployer[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Employer</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Deadline</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell>
                <Link href={`/applications/${application.id}`} className="font-medium hover:underline">
                  {application.title}
                </Link>
              </TableCell>
              <TableCell>
                {application.employer ? (
                  <Link href={`/employers/${application.employer.id}`} className="hover:underline">
                    {application.employer.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>{application.location || <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>
                <Badge variant={applicationStatusVariants[application.status]}>
                  {applicationStatusLabels[application.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {application.deadline ? formatDate(application.deadline) : <span className="text-muted-foreground">—</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
