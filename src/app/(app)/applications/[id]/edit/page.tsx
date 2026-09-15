import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ApplicationForm } from "@/components/applications/application-form";
import { getApplication, getActiveApplicationSummaries } from "@/lib/data/applications";
import { getEmployerOptions } from "@/lib/data/employers";
import { updateApplication } from "@/lib/actions/applications";
import { isAiConfigured } from "@/lib/ai/client";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [application, employers, existingApplications] = await Promise.all([
    getApplication(id),
    getEmployerOptions(),
    getActiveApplicationSummaries(id),
  ]);
  if (!application) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${application.title}`} />
      <ApplicationForm
        action={updateApplication.bind(null, id)}
        application={application}
        employers={employers}
        existingApplications={existingApplications}
        aiAvailable={isAiConfigured()}
      />
    </div>
  );
}
