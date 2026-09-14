import { Plus, Building2 } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { EmployerFilters } from "@/components/employers/employer-filters";
import { EmployersTable } from "@/components/employers/employers-table";
import { getEmployers } from "@/lib/data/employers";

export default async function EmployersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const { employers, total, totalPages } = await getEmployers({ q: params.q, page });

  return (
    <div>
      <PageHeader
        title="Employers"
        description={`${total} employer${total === 1 ? "" : "s"}`}
        actions={
          <LinkButton href="/employers/new">
            <Plus className="h-4 w-4" />
            New Employer
          </LinkButton>
        }
      />

      <EmployerFilters q={params.q} />

      {employers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={params.q ? "No employers match your search" : "No employers yet"}
          description={params.q ? "Try a different search." : "Add an employer to link it to applications."}
          action={
            !params.q && (
              <LinkButton href="/employers/new">
                <Plus className="h-4 w-4" />
                New Employer
              </LinkButton>
            )
          }
        />
      ) : (
        <>
          <EmployersTable employers={employers} />
          <Pagination page={page} totalPages={totalPages} basePath="/employers" searchParams={{ q: params.q }} />
        </>
      )}
    </div>
  );
}
