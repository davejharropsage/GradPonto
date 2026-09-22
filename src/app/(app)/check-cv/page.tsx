import { PageHeader } from "@/components/shared/page-header";
import { ReviewerTabs } from "@/components/check-cv/reviewer-tabs";
import { JobMatchTab } from "@/components/check-cv/job-match-tab";
import { HealthCheckTab } from "@/components/check-cv/health-check-tab";
import { AtsTab } from "@/components/check-cv/ats-tab";
import { CoverLetterTab } from "@/components/check-cv/cover-letter-tab";
import { getAllCvDocuments, getBaseDocuments } from "@/lib/data/documents";
import { getApplicationOptions } from "@/lib/data/applications";
import { isAiConfigured } from "@/lib/ai/client";
import { reviewModes, type ReviewMode } from "@/lib/labels";

export default async function ApplicationReviewerPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string; mode?: string }>;
}) {
  const [cvDocuments, baseDocuments, applications, params] = await Promise.all([
    getAllCvDocuments(),
    getBaseDocuments(),
    getApplicationOptions(),
    searchParams,
  ]);
  const baseCoverLetters = baseDocuments.filter((d) => d.kind === "COVER_LETTER");

  const mode: ReviewMode = (reviewModes as readonly string[]).includes(params.mode ?? "")
    ? (params.mode as ReviewMode)
    : "match";
  const aiAvailable = isAiConfigured();

  return (
    <div>
      <PageHeader
        title="Application Reviewer"
        description="Check your CV against a job, get general feedback, match keywords, or work on your cover letter."
      />
      <div className="max-w-2xl">
        <ReviewerTabs
          mode={mode}
          applicationId={params.applicationId}
          match={
            <JobMatchTab
              cvDocuments={cvDocuments}
              applications={applications}
              aiAvailable={aiAvailable}
              initialApplicationId={params.applicationId}
            />
          }
          health={<HealthCheckTab cvDocuments={cvDocuments} aiAvailable={aiAvailable} />}
          ats={
            <AtsTab
              cvDocuments={cvDocuments}
              applications={applications}
              aiAvailable={aiAvailable}
              initialApplicationId={params.applicationId}
            />
          }
          cover={
            <CoverLetterTab
              baseCoverLetters={baseCoverLetters}
              applications={applications}
              aiAvailable={aiAvailable}
              initialApplicationId={params.applicationId}
            />
          }
        />
      </div>
    </div>
  );
}
