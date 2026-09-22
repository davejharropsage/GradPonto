"use client";

import { useRef, useState } from "react";
import { Plus, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createBaseDocument } from "@/lib/actions/documents";
import { extractCvText } from "@/lib/actions/extract-cv";

/** The "add another named version" affordance — a toggle button that reveals a small create form,
 * either by uploading a PDF/DOCX/TXT file or pasting text directly. */
export function AddVersionForm({
  kind,
  kindLabel,
  startOpen = false,
}: {
  kind: "CV" | "COVER_LETTER";
  kindLabel: string;
  /** Open by default when there's no version of this kind yet, so the page never looks empty. */
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add another {kindLabel.toLowerCase()} version
      </Button>
    );
  }

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const { text, filename } = await extractCvText(formData);
      setContent(text);
      setUploadedFilename(filename);
      if (!name.trim()) setName(filename.replace(/\.(pdf|docx?|txt|md)$/i, ""));
      toast.success(`Loaded ${filename}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read that file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <form
      action={createBaseDocument.bind(null, kind)}
      className="grid gap-3 rounded-lg border border-dashed p-4"
    >
      <div className="grid gap-1.5">
        <Label htmlFor={`new-name-${kind}`}>Version name</Label>
        <Input
          id={`new-name-${kind}`}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`e.g. "Tech ${kindLabel}"`}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {uploadedFilename && (
        <div className="flex items-center justify-between rounded-lg border bg-muted px-3 py-2 text-sm">
          <span className="flex items-center gap-2 truncate font-medium">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            {uploadedFilename}
          </span>
          <button
            type="button"
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => {
              setUploadedFilename(null);
              setContent("");
            }}
            aria-label="Remove uploaded file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!uploadedFilename && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          disabled={uploading}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors",
            dragOver ? "border-primary bg-accent" : "border-input hover:border-primary hover:bg-accent/50"
          )}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{uploading ? "Reading file..." : "Click to upload, or drag and drop"}</span>
          <span className="text-xs text-muted-foreground">PDF, DOCX, or TXT &middot; up to 10MB</span>
        </button>
      )}

      <Textarea
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        placeholder={`Or paste this ${kindLabel.toLowerCase()} version here...`}
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={uploading}>
          Save {kindLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
