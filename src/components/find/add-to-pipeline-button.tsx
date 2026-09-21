"use client";

import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/shared/link-button";
import { addListingToPipeline, type AddListingInput } from "@/lib/actions/find";

/** "Add to pipeline" on a search result. Once added it becomes a link to the new application. */
export function AddToPipelineButton({ listing, existingId }: { listing: AddListingInput; existingId: string | null }) {
  const [addedId, setAddedId] = useState<string | null>(existingId);
  const [pending, startTransition] = useTransition();

  if (addedId) {
    return (
      <LinkButton href={`/applications/${addedId}`} variant="outline" size="sm" aria-label={`In your pipeline: ${listing.title}. View application`}>
        <Check className="h-3.5 w-3.5 text-[var(--gp-sage)]" />
        In your pipeline
      </LinkButton>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      aria-label={`Add ${listing.title} at ${listing.employer} to your pipeline`}
      onClick={() =>
        startTransition(async () => {
          try {
            const result = await addListingToPipeline(listing);
            if (result.ok) {
              setAddedId(result.id);
              toast.success(result.existed ? "That one was already in your pipeline" : "Added to your pipeline as Interested");
            } else {
              toast.error(result.error);
            }
          } catch {
            toast.error("Couldn't add that listing. Please try again.");
          }
        })
      }
    >
      <Plus className="h-3.5 w-3.5" />
      {pending ? "Adding..." : "Add to pipeline"}
    </Button>
  );
}
