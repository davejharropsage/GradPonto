"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/shared/copy-button";
import { DeleteButton } from "@/components/shared/delete-button";
import { toast } from "sonner";
import { updateDocumentContent, renameDocument, deleteDocument } from "@/lib/actions/documents";
import { extractCvText } from "@/lib/actions/extract-cv";
import type { Document } from "@/generated/prisma/client";

/** A single named base CV/cover-letter version: rename, edit its content, or delete it. */
export function DocumentVersionEditor({ document, kindLabel }: { document: Document; kindLabel: string }) {
  const [name, setName] = useState(document.name ?? "");
  const [content, setContent] = useState(document.content);
  const [renaming, startRename] = useTransition();
  const [saving, startSave] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleReplaceFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const { text, filename } = await extractCvText(formData);
      setContent(text);
      toast.success(`Loaded ${filename} — review it below, then Save`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read that file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

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
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleReplaceFile(file);
          }}
        />
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
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Reading file..." : "Replace with a file"}
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
