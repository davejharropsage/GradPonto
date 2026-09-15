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
import { matchCv } from "@/lib/actions/analyze";
import { extractCvText } from "@/lib/actions/extract-cv";
import type { CvMatch } from "@/lib/ai/match-cv";
import type { Document, Application, Employer } from "@/generated/prisma/client";

type CvDoc = Document & { application: (Application & { employer: Employer | null }) | null };

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
  const [cvId, setCvId] = useState(cvDocuments[0]?.id ?? "");
  const [pastedCv, setPastedCv] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState(initialApplicationId ?? "");
  const [result, setResult] = useState<CvMatch | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cvContent = cvId ? cvDocuments.find((d) => d.id === cvId)?.content ?? "" : pastedCv;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startUpload(async () => {
      try {
        const formData = new FormData();
        formData.set("file", file);
        const { text, filename } = await extractCvText(formData);
        setCvId("");
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
          <div className="grid gap-1.5">
            <Label>Your CV</Label>
            {cvDocuments.length > 0 ? (
              <Select value={cvId} onValueChange={(v) => setCvId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => {
                      const doc = cvDocuments.find((d) => d.id === value);
                      if (!doc) return "Upload or paste CV text below";
                      return doc.isBase ? "Base CV" : `Tailored for ${doc.application?.title ?? "an application"}`;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {cvDocuments.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.isBase
                        ? "Base CV"
                        : `Tailored — ${doc.application?.employer?.name ?? "Unknown"} (${doc.application?.title ?? ""})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {(cvDocuments.length === 0 || !cvId) && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? "Reading file..." : "Upload a file"}
                  </Button>
                  <span className="text-xs text-muted-foreground">PDF, DOCX, or TXT — up to 10MB</span>
                </div>

                {uploadedFilename && (
                  <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-1.5 text-sm">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      {uploadedFilename}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setUploadedFilename(null);
                        setPastedCv("");
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <Textarea
                  rows={8}
                  value={pastedCv}
                  onChange={(e) => {
                    setPastedCv(e.target.value);
                    setUploadedFilename(null);
                  }}
                  placeholder="Upload a file above, or paste your CV text here directly."
                />
              </>
            )}
            {cvDocuments.length > 0 && (
              <button
                type="button"
                className="w-fit text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => setCvId("")}
              >
                {cvId ? "Or upload / paste CV text instead" : "Use a saved CV instead"}
              </button>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Select a job to check against</Label>
            <Select value={applicationId} onValueChange={(v) => setApplicationId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a job application...">
                  {(value: string) => {
                    const app = applications.find((a) => a.id === value);
                    return app ? `${app.employer?.name ?? "Unknown"} — ${app.title}` : "Choose a job application...";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.employer?.name ?? "Unknown"} — {app.title}
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
