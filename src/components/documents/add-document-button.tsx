"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { duplicateDocumentForApplication, generateTailoredDocument } from "@/lib/actions/documents";
import { documentKindLabels, coverLetterTemplates } from "@/lib/labels";
import type { Document } from "@/generated/prisma/client";

export function AddDocumentButton({
  applicationId,
  baseDocuments,
  aiAvailable,
}: {
  applicationId: string;
  baseDocuments: Document[];
  aiAvailable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"CV" | "COVER_LETTER">("CV");
  const [baseDocId, setBaseDocId] = useState<string>("");
  const [templateKey, setTemplateKey] = useState(coverLetterTemplates[0].key);
  const [referenceCvId, setReferenceCvId] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const baseForKind = baseDocuments.filter((d) => d.kind === kind);
  const baseDoc = baseForKind.find((d) => d.id === baseDocId) ?? baseForKind[0];

  // A cover letter drafted with AI reads the candidate's CV for specific, real experience to
  // reference, rather than just restyling the base letter's own text. Defaults to whichever base
  // CV exists; only needs a picker when there's a real choice to make.
  const referenceCvs = baseDocuments.filter((d) => d.kind === "CV");
  const referenceCv = referenceCvs.find((d) => d.id === referenceCvId) ?? referenceCvs[0];

  function handleAdd(method: "manual" | "ai") {
    if (!baseDoc) {
      toast.error(`No base ${documentKindLabels[kind]} found. Add one on the Documents page first.`);
      return;
    }
    startTransition(async () => {
      try {
        const doc =
          method === "ai"
            ? await generateTailoredDocument(
                baseDoc.id,
                applicationId,
                kind === "COVER_LETTER" ? templateKey : undefined,
                kind === "COVER_LETTER" ? referenceCv?.content : undefined
              )
            : await duplicateDocumentForApplication(baseDoc.id, applicationId);
        setOpen(false);
        router.push(`/applications/${applicationId}/documents/${doc.id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create document");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a tailored document</DialogTitle>
          <DialogDescription>
            Start from your base CV or cover letter, tailored for this application.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5">
          <Label htmlFor="doc-kind">Document type</Label>
          <Select
            value={kind}
            onValueChange={(v) => {
              setKind(v as "CV" | "COVER_LETTER");
              setBaseDocId("");
            }}
          >
            <SelectTrigger id="doc-kind" className="w-full">
              <SelectValue>{(value: string) => documentKindLabels[value] ?? value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CV">CV</SelectItem>
              <SelectItem value="COVER_LETTER">Cover Letter</SelectItem>
            </SelectContent>
          </Select>
          {!baseDoc && (
            <p className="text-xs text-destructive">
              No base {documentKindLabels[kind]} yet. Add one on the Documents page first.
            </p>
          )}
        </div>

        {baseForKind.length > 1 && (
          <div className="grid gap-1.5">
            <Label htmlFor="doc-base-version">Starting from</Label>
            <Select value={baseDoc?.id ?? ""} onValueChange={(v) => setBaseDocId(v ?? "")}>
              <SelectTrigger id="doc-base-version" className="w-full">
                <SelectValue>
                  {(value: string) => baseForKind.find((d) => d.id === value)?.name || `Untitled ${documentKindLabels[kind]}`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {baseForKind.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name || `Untitled ${documentKindLabels[kind]}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {kind === "COVER_LETTER" && (
          <div className="grid gap-1.5">
            <Label htmlFor="doc-template">Tone (used when generating with AI)</Label>
            <Select value={templateKey} onValueChange={(v) => setTemplateKey(v ?? coverLetterTemplates[0].key)}>
              <SelectTrigger id="doc-template" className="w-full">
                <SelectValue>
                  {(value: string) => coverLetterTemplates.find((t) => t.key === value)?.label ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {coverLetterTemplates.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {kind === "COVER_LETTER" && referenceCvs.length > 1 && (
          <div className="grid gap-1.5">
            <Label htmlFor="doc-reference-cv">Use this CV for context (AI only)</Label>
            <Select value={referenceCv?.id ?? ""} onValueChange={(v) => setReferenceCvId(v ?? "")}>
              <SelectTrigger id="doc-reference-cv" className="w-full">
                <SelectValue>
                  {(value: string) => referenceCvs.find((d) => d.id === value)?.name || "Untitled CV"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {referenceCvs.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name || "Untitled CV"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {kind === "COVER_LETTER" && referenceCvs.length === 1 && (
          <p className="text-xs text-muted-foreground">
            Using {referenceCvs[0].name ? `“${referenceCvs[0].name}”` : "your CV"} for context when generating with AI.
          </p>
        )}
        {kind === "COVER_LETTER" && referenceCvs.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No CV on file yet — add one on the Documents page for a more specific letter.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" disabled={pending || !baseDoc} onClick={() => handleAdd("manual")}>
            <Copy className="h-4 w-4" />
            Duplicate (manual edit)
          </Button>
          <Button disabled={pending || !baseDoc || !aiAvailable} onClick={() => handleAdd("ai")}>
            <Sparkles className="h-4 w-4" />
            {aiAvailable ? "Generate with AI" : "AI not configured"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
