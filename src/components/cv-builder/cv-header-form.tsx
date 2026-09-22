"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { renameDocument } from "@/lib/actions/documents";
import { updateCvHeader } from "@/lib/actions/cv-builder";
import type { Document } from "@/generated/prisma/client";

export function CvHeaderForm({ document }: { document: Document }) {
  const [name, setName] = useState(document.name ?? "");
  const [headline, setHeadline] = useState(document.headline ?? "");
  const [summary, setSummary] = useState(document.summary ?? "");
  const [renaming, startRename] = useTransition();
  const [saving, startSave] = useTransition();

  function handleRenameBlur() {
    if (name === (document.name ?? "")) return;
    startRename(async () => {
      const formData = new FormData();
      formData.set("name", name);
      try {
        await renameDocument(document.id, formData);
        toast.success("Renamed");
      } catch {
        toast.error("Failed to rename");
      }
    });
  }

  function handleHeaderSubmit(formData: FormData) {
    startSave(async () => {
      try {
        await updateCvHeader(document.id, formData);
        toast.success("Saved");
      } catch {
        toast.error("Failed to save");
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-1.5">
          <Label htmlFor={`name-${document.id}`}>Version name</Label>
          <Input
            id={`name-${document.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRenameBlur}
            placeholder="Untitled CV"
            disabled={renaming}
          />
        </div>

        <form action={handleHeaderSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Headline</Label>
            <Input name="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Graduate Data Analyst" />
          </div>
          <div className="grid gap-1.5">
            <Label>Summary</Label>
            <Textarea
              name="summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A short paragraph about who you are and what you're looking for."
            />
          </div>
          <div>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
