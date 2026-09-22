"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Upload, X, Pencil } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { extractCvText } from "@/lib/actions/extract-cv";
import type { Document, Application, Employer } from "@/generated/prisma/client";

export type CvDoc = Document & { application: (Application & { employer: Employer | null }) | null };
type CvSource = "upload" | "saved";

// A named base version reads as its name ("Tech CV"); an unnamed one falls back to "Base CV";
// a tailored copy always reads by the application it was made for, name or not.
function cvLabel(doc: CvDoc) {
  if (!doc.isBase) return `Tailored for ${doc.application?.employer?.name ?? "Unknown"} (${doc.application?.title ?? ""})`;
  return doc.name || "Base CV";
}

/**
 * Pick a CV: a saved version, an uploaded PDF/DOCX/TXT file, or pasted text. Shared by every
 * Application Reviewer mode (Job Match, Health Check, ATS Keywords) so the selection experience
 * — and the parsing behind it — only exists once. The picker owns its own selection state and
 * reports the resulting text up via `onContentChange` whenever it changes.
 */
export function CvSourcePicker({
  cvDocuments,
  onContentChange,
}: {
  cvDocuments: CvDoc[];
  onContentChange: (content: string) => void;
}) {
  const [source, setSource] = useState<CvSource>(cvDocuments.length > 0 ? "saved" : "upload");
  const [cvId, setCvId] = useState(cvDocuments[0]?.id ?? "");
  const [pastedCv, setPastedCv] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDoc = cvDocuments.find((d) => d.id === cvId);
  const cvContent = source === "saved" ? selectedDoc?.content ?? "" : pastedCv;
  const editHref = selectedDoc
    ? selectedDoc.isBase
      ? "/documents"
      : `/applications/${selectedDoc.applicationId}/documents/${selectedDoc.id}`
    : null;

  // onContentChange is always a state setter passed down by the caller, so it's stable — safe
  // to depend on without causing a render loop.
  useEffect(() => onContentChange(cvContent), [cvContent, onContentChange]);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const { text, filename } = await extractCvText(formData);
      setSource("upload");
      setPastedCv(text);
      setUploadedFilename(filename);
      toast.success(`Loaded ${filename}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read that file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <Label>Your CV</Label>

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

      {uploadedFilename ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted px-4 py-3 text-sm">
          <span className="flex items-center gap-2 truncate font-medium">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            {uploadedFilename}
          </span>
          <button
            type="button"
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => {
              setUploadedFilename(null);
              setPastedCv("");
            }}
            aria-label="Remove uploaded file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
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
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragOver ? "border-primary bg-accent" : "border-input hover:border-primary hover:bg-accent/50"
          )}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="font-semibold">
            {uploading ? "Reading file..." : "Click to upload your CV"}
          </span>
          <span className="text-xs text-muted-foreground">
            or drag and drop &middot; PDF, DOCX, or TXT (up to 10MB)
          </span>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs">
        {cvDocuments.length > 0 && source !== "saved" && (
          <button
            type="button"
            className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={() => {
              setSource("saved");
              setUploadedFilename(null);
            }}
          >
            Use a saved CV instead
          </button>
        )}
        {!(source === "upload" && !uploadedFilename) && (
          <button
            type="button"
            className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={() => {
              // Carry over the currently selected CV's text so switching to "paste"
              // reads as editing/copying it, not starting from a blank box.
              if (!pastedCv && cvContent) setPastedCv(cvContent);
              setSource("upload");
              setUploadedFilename(null);
            }}
          >
            Or paste / edit CV text
          </button>
        )}
      </div>

      {source === "saved" && cvDocuments.length > 0 && (
        <div className="flex gap-2">
          <Select value={cvId} onValueChange={(v) => setCvId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: string) => {
                  const doc = cvDocuments.find((d) => d.id === value);
                  return doc ? cvLabel(doc) : "Choose a saved CV...";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {cvDocuments.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  {cvLabel(doc)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {editHref && (
            <LinkButton href={editHref} variant="outline" size="sm" className="shrink-0">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </LinkButton>
          )}
        </div>
      )}

      {source === "upload" && !uploadedFilename && (
        <Textarea
          rows={8}
          value={pastedCv}
          onChange={(e) => setPastedCv(e.target.value)}
          placeholder="Paste your CV text here directly."
        />
      )}
    </div>
  );
}
