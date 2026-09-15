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
import { documentKindLabels } from "@/lib/labels";
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
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const baseForKind = baseDocuments.filter((d) => d.kind === kind);
  const baseDoc = baseForKind[0];

  function handleAdd(method: "manual" | "ai") {
    if (!baseDoc) {
      toast.error(`No base ${documentKindLabels[kind]} found. Add one on the Documents page first.`);
      return;
    }
    startTransition(async () => {
      try {
        const doc =
          method === "ai"
            ? await generateTailoredDocument(baseDoc.id, applicationId)
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
          <Select value={kind} onValueChange={(v) => setKind(v as "CV" | "COVER_LETTER")}>
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
