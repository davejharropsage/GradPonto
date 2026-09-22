"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/shared/copy-button";
import { DeleteButton } from "@/components/shared/delete-button";
import { toast } from "sonner";
import { updateDocumentContent, renameDocument, deleteDocument } from "@/lib/actions/documents";
import type { Document } from "@/generated/prisma/client";

/** A single named base CV/cover-letter version: rename, edit its content, or delete it. */
export function DocumentVersionEditor({ document, kindLabel }: { document: Document; kindLabel: string }) {
  const [name, setName] = useState(document.name ?? "");
  const [content, setContent] = useState(document.content);
  const [renaming, startRename] = useTransition();
  const [saving, startSave] = useTransition();

  function handleRenameBlur() {
    if (name === (document.name ?? "")) return;
    startRename(async () => {
      const formData = new FormData();
      formData.set("name", name);
      try {
        await renameDocument(document.id, formData);
        toast.success("Renamed");
      } catch {
        toast.error("Failed to rename");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor={`name-${document.id}`}>Version name</Label>
        <Input
          id={`name-${document.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleRenameBlur}
          placeholder={`Untitled ${kindLabel}`}
          disabled={renaming}
        />
      </div>

      <form
        action={(formData) =>
          startSave(async () => {
            try {
              await updateDocumentContent(document.id, formData);
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
          rows={16}
          className="font-mono text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <CopyButton value={content} label="Copy text" />
          <DeleteButton
            action={() => deleteDocument(document.id)}
            label={`Delete ${name || `this ${kindLabel.toLowerCase()}`}`}
            redirectTo="/documents"
          />
        </div>
      </form>
    </div>
  );
}
