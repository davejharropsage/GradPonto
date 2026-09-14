import { PageHeader } from "@/components/shared/page-header";
import { CheckCvForm } from "@/components/check-cv/check-cv-form";
import { getAllCvDocuments } from "@/lib/data/documents";
import { getApplicationOptions } from "@/lib/data/applications";
import { isAiConfigured } from "@/lib/ai/client";

export default async function CheckCvPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string }>;
}) {
  const [cvDocuments, applications, params] = await Promise.all([
    getAllCvDocuments(),
    getApplicationOptions(),
    searchParams,
  ]);

  return (
    <div>
      <PageHeader
        title="Check My CV"
        description="Select a CV and a job to see how well your CV matches and how to improve it."
      />
      <div className="max-w-2xl">
        <CheckCvForm
          cvDocuments={cvDocuments}
          applications={applications}
          aiAvailable={isAiConfigured()}
          initialApplicationId={params.applicationId}
        />
      </div>
    </div>
  );
}
