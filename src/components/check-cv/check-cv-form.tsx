"use client";

import { useRef, useState, useTransition } from "react";
import { Sparkles, FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { matchCv } from "@/lib/actions/analyze";
import { extractCvText } from "@/lib/actions/extract-cv";
import type { CvMatch } from "@/lib/ai/match-cv";
import type { Document, Application, Employer } from "@/generated/prisma/client";

type CvDoc = Document & { application: (Application & { employer: Employer | null }) | null };
type CvSource = "upload" | "saved";

export function CheckCvForm({
  cvDocuments,
  applications,
  aiAvailable,
  initialApplicationId,
}: {
  cvDocuments: CvDoc[];
  applications: { id: string; title: string; employer: { name: string } | null }[];
  aiAvailable: boolean;
  initialApplicationId?: string;
}) {
  const [source, setSource] = useState<CvSource>(cvDocuments.length > 0 ? "saved" : "upload");
  const [cvId, setCvId] = useState(cvDocuments[0]?.id ?? "");
  const [pastedCv, setPastedCv] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState(initialApplicationId ?? "");
  const [result, setResult] = useState<CvMatch | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, startUpload] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cvContent = source === "saved" ? cvDocuments.find((d) => d.id === cvId)?.content ?? "" : pastedCv;

  function handleFile(file: File) {
    startUpload(async () => {
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
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

  function handleAnalyse() {
    if (!cvContent.trim() || !applicationId) return;
    startTransition(async () => {
      try {
        const match = await matchCv({ cvContent, applicationId });
        setResult(match);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to analyse CV");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
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
                    setSource("upload");
                    setUploadedFilename(null);
                  }}
                >
                  Or paste CV text
                </button>
              )}
            </div>

            {source === "saved" && cvDocuments.length > 0 && (
              <Select value={cvId} onValueChange={(v) => setCvId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => {
                      const doc = cvDocuments.find((d) => d.id === value);
                      if (!doc) return "Choose a saved CV...";
                      return doc.isBase ? "Base CV" : `Tailored for ${doc.application?.title ?? "an application"}`;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {cvDocuments.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.isBase
                        ? "Base CV"
                        : `Tailored for ${doc.application?.employer?.name ?? "Unknown"} (${doc.application?.title ?? ""})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="grid gap-1.5">
            <Label>Select a job to check against</Label>
            <Select value={applicationId} onValueChange={(v) => setApplicationId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a job application...">
                  {(value: string) => {
                    const app = applications.find((a) => a.id === value);
                    return app ? `${app.employer?.name ?? "Unknown"}: ${app.title}` : "Choose a job application...";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.employer?.name ?? "Unknown"}: {app.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={!cvContent.trim() || !applicationId || pending || !aiAvailable}
            onClick={handleAnalyse}
          >
            <Sparkles className="h-4 w-4" />
            {!aiAvailable ? "AI not configured" : pending ? "Analysing..." : "Analyse My CV"}
          </Button>
        </CardContent>
      </Card>

      {!aiAvailable && (
        <p className="text-sm text-muted-foreground">
          Add <code className="rounded bg-muted px-1 py-0.5">ANTHROPIC_API_KEY</code> to <code className="rounded bg-muted px-1 py-0.5">.env</code> to enable CV matching.
        </p>
      )}

      {result && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {result.score}
              </div>
              <div>
                <p className="font-semibold">Match score</p>
                <p className="text-sm text-muted-foreground">out of 100</p>
              </div>
            </div>

            <div>
              <h4 className="mb-1.5 text-sm font-medium">Strengths</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-500">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-1.5 text-sm font-medium">Gaps</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {result.gaps.map((g, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-500">!</span> {g}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-1.5 text-sm font-medium">Suggestions</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
