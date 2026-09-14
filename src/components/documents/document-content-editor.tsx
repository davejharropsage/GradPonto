"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateDocumentContent } from "@/lib/actions/documents";

export function DocumentContentEditor({ documentId, initialContent }: { documentId: string; initialContent: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          try {
            await updateDocumentContent(documentId, formData);
            toast.success("Saved");
          } catch {
            toast.error("Failed to save");
          }
        })
      }
      className="grid gap-3"
    >
      <Textarea name="content" defaultValue={initialContent} rows={20} className="font-mono text-sm" />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
