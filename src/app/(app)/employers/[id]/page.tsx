import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Globe, FileText, User, Mail, Phone } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteButton } from "@/components/shared/delete-button";
import { MergeEmployerDialog } from "@/components/employers/merge-employer-dialog";
import { getEmployer, getEmployerOptions } from "@/lib/data/employers";
import { deleteEmployer } from "@/lib/actions/employers";
import { applicationStatusLabels, applicationStatusVariants } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export default async function EmployerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [employer, allEmployers] = await Promise.all([getEmployer(id), getEmployerOptions()]);
  if (!employer) notFound();

  return (
    <div>
      <PageHeader
        title={employer.name}
        description={employer.industry ?? undefined}
        actions={
          <>
            <LinkButton href={`/employers/${employer.id}/edit`} variant="outline">
              <Pencil className="h-4 w-4" />
              Edit
            </LinkButton>
            <MergeEmployerDialog
              employerId={employer.id}
              employerName={employer.name}
              otherEmployers={allEmployers.filter((e) => e.id !== employer.id)}
            />
            <DeleteButton
              action={deleteEmployer.bind(null, employer.id)}
              label="Delete Employer"
              redirectTo="/employers"
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {employer.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {employer.website}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Created {formatDate(employer.createdAt)} &middot; Updated {formatDate(employer.updatedAt)}
              </p>
            </CardContent>
          </Card>

          {(employer.contactName || employer.contactEmail || employer.contactPhone) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {employer.contactName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {employer.contactName}
                    {employer.contactRole && <span className="text-muted-foreground">&middot; {employer.contactRole}</span>}
                  </div>
                )}
                {employer.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a href={`mailto:${employer.contactEmail}`} className="truncate hover:underline">
                      {employer.contactEmail}
                    </a>
                  </div>
                )}
                {employer.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${employer.contactPhone}`} className="hover:underline">
                      {employer.contactPhone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {employer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{employer.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {employer.applications.length === 0 ? (
                <EmptyState icon={FileText} title="No applications yet" />
              ) : (
                <ul className="divide-y">
                  {employer.applications.map((application) => (
                    <li key={application.id} className="flex items-center justify-between gap-2 py-3">
                      <Link href={`/applications/${application.id}`} className="text-sm font-medium hover:underline">
                        {application.title}
                      </Link>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {application.archived && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Archived
                          </Badge>
                        )}
                        <Badge variant={applicationStatusVariants[application.status]}>
                          {applicationStatusLabels[application.status]}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
