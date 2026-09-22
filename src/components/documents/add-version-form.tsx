"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, FileText, X, ListChecks, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createBaseDocument, createStructuredCv } from "@/lib/actions/documents";
import { extractCvText } from "@/lib/actions/extract-cv";

type Mode = "choose" | "freeform";

/** The "add another named version" affordance — a toggle button that reveals a small create form.
 * For a CV, the first choice is *how* to write it: paste/upload text freeform, or build it
 * section by section (the CV builder, lib/actions/cv-builder.ts). A cover letter only ever
 * offers the freeform path. */
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
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [mode, setMode] = useState<Mode>(kind === "CV" ? "choose" : "freeform");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [buildingStructured, startBuildingStructured] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true);
          setMode(kind === "CV" ? "choose" : "freeform");
        }}
      >
        <Plus className="h-4 w-4" />
        Add another {kindLabel.toLowerCase()} version
      </Button>
    );
  }

  function handleBuildFromSections() {
    startBuildingStructured(async () => {
      const formData = new FormData();
      formData.set("name", name);
      try {
        const document = await createStructuredCv(formData);
        router.push(`/documents/${document.id}/builder`);
      } catch {
        toast.error("Failed to start a new CV");
      }
    });
  }

  if (mode === "choose") {
    return (
      <div className="grid gap-3 rounded-lg border border-dashed p-4">
        <div className="grid gap-1.5">
          <Label htmlFor={`new-name-${kind}`}>Version name</Label>
          <Input
            id={`new-name-${kind}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. "Tech CV"'
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("freeform")}
            className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-sm transition-colors hover:border-primary hover:bg-accent/50"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <PenLine className="h-4 w-4" />
              Write freeform
            </span>
            <span className="text-xs text-muted-foreground">Paste or upload a CV as one block of text.</span>
          </button>
          <button
            type="button"
            onClick={handleBuildFromSections}
            disabled={buildingStructured}
            className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-sm transition-colors hover:border-primary hover:bg-accent/50 disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <ListChecks className="h-4 w-4" />
              {buildingStructured ? "Starting..." : "Build from sections"}
            </span>
            <span className="text-xs text-muted-foreground">Fill in experience, education and skills one at a time.</span>
          </button>
        </div>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
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
        <Button
          type="button"
          variant="outline"
          onClick={() => (kind === "CV" ? setMode("choose") : setOpen(false))}
        >
          {kind === "CV" ? "Back" : "Cancel"}
        </Button>
      </div>
    </form>
  );
}
