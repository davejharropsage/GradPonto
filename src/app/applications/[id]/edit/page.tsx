import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ApplicationForm } from "@/components/applications/application-form";
import { getApplication } from "@/lib/data/applications";
import { getEmployerOptions } from "@/lib/data/employers";
import { updateApplication } from "@/lib/actions/applications";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [application, employers] = await Promise.all([getApplication(id), getEmployerOptions()]);
  if (!application) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${application.title}`} />
      <ApplicationForm action={updateApplication.bind(null, id)} application={application} employers={employers} />
    </div>
  );
}
