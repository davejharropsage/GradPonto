"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { LinkButton } from "@/components/shared/link-button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateTailoredDocument } from "@/lib/actions/documents";
import { coverLetterTemplates } from "@/lib/labels";
import type { Document } from "@/generated/prisma/client";

/** Picks a base cover letter, a job, and a tone, then generates a tailored copy in that style. */
export function CoverLetterTab({
  baseCoverLetters,
  applications,
  aiAvailable,
  initialApplicationId,
}: {
  baseCoverLetters: Document[];
  applications: { id: string; title: string; employer: { name: string } | null }[];
  aiAvailable: boolean;
  initialApplicationId?: string;
}) {
  const router = useRouter();
  const [baseId, setBaseId] = useState(baseCoverLetters[0]?.id ?? "");
  const [applicationId, setApplicationId] = useState(initialApplicationId ?? "");
  const [templateKey, setTemplateKey] = useState(coverLetterTemplates[0].key);
  const [pending, startTransition] = useTransition();

  const baseDoc = baseCoverLetters.find((d) => d.id === baseId);

  function handleGenerate() {
    if (!baseDoc || !applicationId) return;
    startTransition(async () => {
      try {
        const doc = await generateTailoredDocument(baseDoc.id, applicationId, templateKey);
        toast.success("Cover letter generated");
        router.push(`/applications/${applicationId}/documents/${doc.id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to generate a cover letter");
      }
    });
  }

  if (baseCoverLetters.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No base cover letter yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add one on the Documents page, then come back here to generate a tailored version in the tone you want.
          </p>
          <LinkButton href="/documents" variant="outline" size="sm">
            Go to Documents
          </LinkButton>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          {baseCoverLetters.length > 1 && (
            <div className="grid gap-1.5">
              <Label>Starting from</Label>
              <Select value={baseId} onValueChange={(v) => setBaseId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => baseCoverLetters.find((d) => d.id === value)?.name || "Untitled Cover Letter"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {baseCoverLetters.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name || "Untitled Cover Letter"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label>Select a job to write for</Label>
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

          <div className="grid gap-2">
            <Label>Tone</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {coverLetterTemplates.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTemplateKey(t.key)}
                  aria-pressed={templateKey === t.key}
                  className={cn(
                    "rounded-lg border p-3 text-left text-sm transition-colors",
                    templateKey === t.key ? "border-primary bg-accent" : "hover:bg-accent/50"
                  )}
                >
                  <p className="font-medium">{t.label}</p>
                  <p className="mt-0.5 text-xs italic text-muted-foreground">&ldquo;{t.example}&rdquo;</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={!baseDoc || !applicationId || pending || !aiAvailable}
            onClick={handleGenerate}
          >
            <Sparkles className="h-4 w-4" />
            {!aiAvailable ? "AI not configured" : pending ? "Generating..." : "Generate Cover Letter"}
          </Button>
        </CardContent>
      </Card>

      {!aiAvailable && (
        <p className="text-sm text-muted-foreground">
          Add <code className="rounded bg-muted px-1 py-0.5">GEMINI_API_KEY</code> to <code className="rounded bg-muted px-1 py-0.5">.env</code> to enable cover letter generation.
        </p>
      )}
    </div>
  );
}
