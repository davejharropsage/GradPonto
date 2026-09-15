import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Globe, MapPin, Building2, PoundSterling, FileCheck2 } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ActivityLog } from "@/components/activities/activity-log";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import { DeleteButton } from "@/components/shared/delete-button";
import { DeadlineBadge } from "@/components/applications/deadline-badge";
import { DuplicateButton } from "@/components/applications/duplicate-button";
import { CopyButton } from "@/components/shared/copy-button";
import { PrintButton } from "@/components/shared/print-button";
import { getApplication } from "@/lib/data/applications";
import { getBaseDocuments } from "@/lib/data/documents";
import { deleteApplication } from "@/lib/actions/applications";
import { applicationStatusLabels, applicationStatusColors, priorityLabels, priorityColors } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [application, baseDocuments] = await Promise.all([getApplication(id), getBaseDocuments()]);
  if (!application) notFound();

  const aiAvailable = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div>
      <PageHeader
        title={application.title}
        description={application.employer?.name}
        actions={
          <>
            <PrintButton />
            <LinkButton href={`/check-cv?applicationId=${application.id}`} variant="outline">
              <FileCheck2 className="h-4 w-4" />
              Check My CV
            </LinkButton>
            <LinkButton href={`/applications/${application.id}/edit`} variant="outline">
              <Pencil className="h-4 w-4" />
              Edit
            </LinkButton>
            <DuplicateButton applicationId={application.id} variant="button" />
            <DeleteButton
              action={deleteApplication.bind(null, application.id)}
              label="Delete Application"
              redirectTo="/applications"
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
              <div className="flex flex-wrap gap-1.5">
                <Badge className={applicationStatusColors[application.status]} variant="outline">
                  {applicationStatusLabels[application.status]}
                </Badge>
                <Badge className={priorityColors[application.priority]} variant="outline">
                  {priorityLabels[application.priority]}
                </Badge>
              </div>
              {application.employer && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Link href={`/employers/${application.employer.id}`} className="hover:underline">
                    {application.employer.name}
                  </Link>
                </div>
              )}
              {application.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {application.location}
                </div>
              )}
              {application.jobUrl && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a href={application.jobUrl} target="_blank" rel="noreferrer" className="truncate hover:underline">
                    {application.jobUrl}
                  </a>
                  <CopyButton value={application.jobUrl} label="" className="ml-auto shrink-0 px-2" />
                </div>
              )}
              {application.salary && (
                <div className="flex items-center gap-2">
                  <PoundSterling className="h-4 w-4 text-muted-foreground" />
                  {application.salary}
                </div>
              )}
              {application.deadline && <DeadlineBadge deadline={application.deadline} />}
              {application.source && <p className="text-muted-foreground">Source: {application.source}</p>}
              {application.appliedAt && (
                <p className="text-muted-foreground">Applied {formatDate(application.appliedAt)}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Created {formatDate(application.createdAt)} &middot; Updated {formatDate(application.updatedAt)}
              </p>
            </CardContent>
          </Card>

          {application.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{application.description}</p>
              </CardContent>
            </Card>
          )}

          {application.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{application.notes}</p>
              </CardContent>
            </Card>
          )}

          <DocumentsPanel
            applicationId={application.id}
            documents={application.documents}
            baseDocuments={baseDocuments}
            aiAvailable={aiAvailable}
          />
        </div>

        <div className="lg:col-span-2">
          <ActivityLog activities={application.activities} applicationId={application.id} />
        </div>
      </div>
    </div>
  );
}
