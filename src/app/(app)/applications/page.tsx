import { Plus, FileText, Download, Upload } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { ApplicationFilters } from "@/components/applications/application-filters";
import { ApplicationsGrid } from "@/components/applications/applications-grid";
import { getApplications } from "@/lib/data/applications";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; archived?: string }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const archived = params.archived === "1";

  const { applications, total, totalPages, archivedCount } = await getApplications({
    q: params.q,
    status: params.status,
    archived,
    page,
  });

  return (
    <div>
      <PageHeader
        title="Applications"
        description={`${total} application${total === 1 ? "" : "s"}`}
        actions={
          <>
            <LinkButton href="/applications/import" variant="outline">
              <Upload className="h-4 w-4" />
              Import CSV
            </LinkButton>
            <LinkButton href="/api/applications/export" variant="outline">
              <Download className="h-4 w-4" />
              Export CSV
            </LinkButton>
            <LinkButton href="/applications/new">
              <Plus className="h-4 w-4" />
              New Application
            </LinkButton>
          </>
        }
      />

      <ApplicationFilters q={params.q} status={params.status} archived={archived} archivedCount={archivedCount} />

      {applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            params.q || params.status
              ? "No applications match your filters"
              : archivedCount > 0
                ? "All your applications are archived"
                : "No applications yet"
          }
          description={
            params.q || params.status
              ? "Try adjusting your search or filters."
              : archivedCount > 0
                ? `Show archived to see the ${archivedCount} application${archivedCount === 1 ? "" : "s"} you've put away.`
                : "Add your first placement opportunity to get started."
          }
          action={
            !params.q && !params.status && archivedCount === 0 ? (
              <LinkButton href="/applications/new">
                <Plus className="h-4 w-4" />
                New Application
              </LinkButton>
            ) : undefined
          }
        />
      ) : (
        <>
          <ApplicationsGrid applications={applications} />
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/applications"
            searchParams={{ q: params.q, status: params.status, archived: params.archived }}
          />
        </>
      )}
    </div>
  );
}
