import { PageHeader } from "@/components/shared/page-header";
import { ApplicationForm } from "@/components/applications/application-form";
import { createApplication } from "@/lib/actions/applications";
import { getEmployerOptions } from "@/lib/data/employers";

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [employers, params] = await Promise.all([getEmployerOptions(), searchParams]);

  const initial = {
    title: params.title,
    company: params.company,
    location: params.location,
    salary: params.salary,
    deadline: params.deadline,
    description: params.description,
    jobUrl: params.jobUrl,
  };
  const hasInitial = Object.values(initial).some(Boolean);

  return (
    <div>
      <PageHeader title="New Application" />
      <ApplicationForm action={createApplication} employers={employers} initial={hasInitial ? initial : undefined} />
    </div>
  );
}
