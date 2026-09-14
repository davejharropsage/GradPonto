import { Plus, FileText } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { ApplicationFilters } from "@/components/applications/application-filters";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { getApplications } from "@/lib/data/applications";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const { applications, total, totalPages } = await getApplications({
    q: params.q,
    status: params.status,
    page,
  });

  return (
    <div>
      <PageHeader
        title="Applications"
        description={`${total} application${total === 1 ? "" : "s"}`}
        actions={
          <LinkButton href="/applications/new">
            <Plus className="h-4 w-4" />
            New Application
          </LinkButton>
        }
      />

      <ApplicationFilters q={params.q} status={params.status} />

      {applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={params.q || params.status ? "No applications match your filters" : "No applications yet"}
          description={
            params.q || params.status
              ? "Try adjusting your search or filters."
              : "Add your first placement opportunity to get started."
          }
          action={
            !params.q && !params.status && (
              <LinkButton href="/applications/new">
                <Plus className="h-4 w-4" />
                New Application
              </LinkButton>
            )
          }
        />
      ) : (
        <>
          <ApplicationsTable applications={applications} />
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/applications"
            searchParams={{ q: params.q, status: params.status }}
          />
        </>
      )}
    </div>
  );
}
