"use client";

import { useState, useTransition } from "react";
import { Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { CvSourcePicker, type CvDoc } from "./cv-source-picker";
import { matchCv } from "@/lib/actions/analyze";
import type { CvMatch } from "@/lib/ai/match-cv";

/** Compares one CV against one job's description and scores the match — the Reviewer's original mode. */
export function JobMatchTab({
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
  const [cvContent, setCvContent] = useState("");
  const [applicationId, setApplicationId] = useState(initialApplicationId ?? "");
  const [result, setResult] = useState<CvMatch | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAnalyse() {
    if (!cvContent.trim() || !applicationId) return;
    startTransition(async () => {
      const result = await matchCv({ cvContent, applicationId });
      if (!result.ok) toast.error(result.error);
      else setResult(result.data);
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <CvSourcePicker cvDocuments={cvDocuments} onContentChange={setCvContent} />

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
          Add <code className="rounded bg-muted px-1 py-0.5">GEMINI_API_KEY</code> to <code className="rounded bg-muted px-1 py-0.5">.env</code> to enable CV matching.
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
