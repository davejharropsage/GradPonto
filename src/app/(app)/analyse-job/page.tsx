import { PageHeader } from "@/components/shared/page-header";
import { AnalyseJobForm } from "@/components/analyse-job/analyse-job-form";
import { isAiConfigured } from "@/lib/ai/client";

export default function AnalyseJobPage() {
  return (
    <div>
      <PageHeader
        title="Analyse a Job"
        description="Paste a job description and we'll extract the key details and pre-fill an application for you."
      />
      <div className="max-w-2xl">
        <AnalyseJobForm aiAvailable={isAiConfigured()} />
      </div>
    </div>
  );
}
