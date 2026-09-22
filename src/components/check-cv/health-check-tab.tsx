"use client";

import { useState, useTransition } from "react";
import { Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CvSourcePicker, type CvDoc } from "./cv-source-picker";
import { reviewCvHealth } from "@/lib/actions/analyze";
import type { CvHealthCheck } from "@/lib/ai/review-cv";

/** A general review of a CV on its own terms — no job attached, just structure, clarity and impact. */
export function HealthCheckTab({
  cvDocuments,
  aiAvailable,
}: {
  cvDocuments: CvDoc[];
  aiAvailable: boolean;
}) {
  const [cvContent, setCvContent] = useState("");
  const [result, setResult] = useState<CvHealthCheck | null>(null);
  const [pending, startTransition] = useTransition();

  function handleReview() {
    if (!cvContent.trim()) return;
    startTransition(async () => {
      try {
        const check = await reviewCvHealth(cvContent);
        setResult(check);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to review CV");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <CvSourcePicker cvDocuments={cvDocuments} onContentChange={setCvContent} />

          <Button
            type="button"
            className="w-full"
            disabled={!cvContent.trim() || pending || !aiAvailable}
            onClick={handleReview}
          >
            <Sparkles className="h-4 w-4" />
            {!aiAvailable ? "AI not configured" : pending ? "Reviewing..." : "Review My CV"}
          </Button>
        </CardContent>
      </Card>

      {!aiAvailable && (
        <p className="text-sm text-muted-foreground">
          Add <code className="rounded bg-muted px-1 py-0.5">GEMINI_API_KEY</code> to <code className="rounded bg-muted px-1 py-0.5">.env</code> to enable the health check.
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
                <p className="font-semibold">Overall health</p>
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
              <h4 className="mb-1.5 text-sm font-medium">Issues</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {result.issues.map((issue, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-500">!</span> {issue}
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
