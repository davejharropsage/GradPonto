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
        description="Pick up a card and drop it in another stage to update its status. On a keyboard, press Space on a card, use the arrow keys, then Space again."
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
