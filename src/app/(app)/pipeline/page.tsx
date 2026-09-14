import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LinkButton } from "@/components/shared/link-button";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { getApplicationsByStatus } from "@/lib/data/applications";

export default async function PipelinePage() {
  const groups = await getApplicationsByStatus();

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Drag applications between stages to update their status."
        actions={
          <LinkButton href="/applications/new">
            <Plus className="h-4 w-4" />
            Add application
          </LinkButton>
        }
      />
      <PipelineBoard initialGroups={groups} />
    </div>
  );
}
