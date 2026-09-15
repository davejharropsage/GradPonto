"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/shared/copy-button";
import { toast } from "sonner";
import { updateDocumentContent } from "@/lib/actions/documents";

export function DocumentContentEditor({ documentId, initialContent }: { documentId: string; initialContent: string }) {
  const [content, setContent] = useState(initialContent);
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
      <Textarea
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={20}
        className="font-mono text-sm"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
        <CopyButton value={content} label="Copy text" />
      </div>
    </form>
  );
}
