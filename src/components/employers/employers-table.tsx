import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Employer } from "@/generated/prisma/client";

type EmployerWithCounts = Employer & { _count: { applications: number } };

export function EmployersTable({ employers }: { employers: EmployerWithCounts[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Applications</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employers.map((employer) => (
            <TableRow key={employer.id}>
              <TableCell>
                <Link href={`/employers/${employer.id}`} className="font-medium hover:underline">
                  {employer.name}
                </Link>
              </TableCell>
              <TableCell>{employer.industry || <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>{employer.website || <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>{employer._count.applications}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
