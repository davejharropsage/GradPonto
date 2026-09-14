import { PageHeader } from "@/components/shared/page-header";
import { ApplicationForm } from "@/components/applications/application-form";
import { createApplication } from "@/lib/actions/applications";
import { getEmployerOptions } from "@/lib/data/employers";

export default async function NewApplicationPage() {
  const employers = await getEmployerOptions();

  return (
    <div>
      <PageHeader title="New Application" />
      <ApplicationForm action={createApplication} employers={employers} />
    </div>
  );
}
