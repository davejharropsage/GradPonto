"use client";

import { useMemo, useState, useTransition } from "react";
import { Sparkles, Check, X } from "lucide-react";
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
import { getAtsKeywords } from "@/lib/actions/analyze";
import { matchKeywordsToCv, coveragePercent } from "@/lib/cv/ats";

/**
 * Extracts the keywords an ATS would scan a job posting for, then checks a CV against them with a
 * plain word match (not an AI judgement) — so switching CVs re-checks instantly, no AI call needed.
 */
export function AtsTab({
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
  const [keywords, setKeywords] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  const matches = useMemo(() => (keywords ? matchKeywordsToCv(keywords, cvContent) : null), [keywords, cvContent]);
  const coverage = matches ? coveragePercent(matches) : null;
  const foundCount = matches ? matches.filter((m) => m.found).length : 0;

  function handleCheck() {
    if (!cvContent.trim() || !applicationId) return;
    startTransition(async () => {
      const result = await getAtsKeywords(applicationId);
      if (!result.ok) toast.error(result.error);
      else setKeywords(result.data);
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <CvSourcePicker cvDocuments={cvDocuments} onContentChange={setCvContent} />

          <div className="grid gap-1.5">
            <Label>Select a job to check against</Label>
            <Select
              value={applicationId}
              onValueChange={(v) => {
                setApplicationId(v ?? "");
                setKeywords(null);
              }}
            >
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
            onClick={handleCheck}
          >
            <Sparkles className="h-4 w-4" />
            {!aiAvailable ? "AI not configured" : pending ? "Finding keywords..." : keywords ? "Re-check keywords" : "Check Keywords"}
          </Button>
        </CardContent>
      </Card>

      {!aiAvailable && (
        <p className="text-sm text-muted-foreground">
          Add <code className="rounded bg-muted px-1 py-0.5">GEMINI_API_KEY</code> to <code className="rounded bg-muted px-1 py-0.5">.env</code> to enable keyword extraction.
        </p>
      )}

      {matches && coverage !== null && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {coverage}%
              </div>
              <div>
                <p className="font-semibold">Keyword coverage</p>
                <p className="text-sm text-muted-foreground">
                  {foundCount} of {matches.length} keywords found in your CV
                </p>
              </div>
            </div>

            <ul className="space-y-1.5 text-sm">
              {matches.map((m) => (
                <li key={m.keyword} className="flex items-center gap-2">
                  {m.found ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={m.found ? "" : "text-muted-foreground"}>{m.keyword}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground">
              A literal word match, not an AI judgement — switch CVs above and this updates instantly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
