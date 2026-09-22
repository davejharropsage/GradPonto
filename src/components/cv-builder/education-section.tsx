"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton } from "@/components/shared/delete-button";
import { toast } from "sonner";
import { addEducation, updateEducation, removeEducation, moveEducation } from "@/lib/actions/cv-builder";
import { educationFormDefaults } from "@/lib/cv/form-defaults";
import type { Education } from "@/generated/prisma/client";

function EducationForm({
  documentId,
  education,
  onAdded,
}: {
  documentId: string;
  education?: Education;
  onAdded?: () => void;
}) {
  const defaults = educationFormDefaults(education ?? undefined);
  const [values, setValues] = useState(defaults);
  const [saving, startSaving] = useTransition();
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  function handleSubmit(formData: FormData) {
    startSaving(async () => {
      try {
        if (education) {
          await updateEducation(documentId, education.id, formData);
          toast.success("Saved");
        } else {
          await addEducation(documentId, formData);
          setValues(defaults);
          onAdded?.();
        }
      } catch {
        toast.error("Failed to save");
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Qualification</Label>
          <Input name="qualification" value={values.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="BSc" />
        </div>
        <div className="grid gap-1.5">
          <Label>Field of study</Label>
          <Input name="field" value={values.field} onChange={(e) => set("field", e.target.value)} placeholder="Computer Science" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label>Institution</Label>
        <Input name="institution" value={values.institution} onChange={(e) => set("institution", e.target.value)} placeholder="University of Leeds" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label>Start</Label>
          <Input type="month" name="startDate" value={values.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>End</Label>
          <Input type="month" name="endDate" value={values.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Grade</Label>
          <Input name="grade" value={values.grade} onChange={(e) => set("grade", e.target.value)} placeholder="2:1" />
        </div>
      </div>
      <div>
        <Button type="submit" size="sm" disabled={saving || !values.institution.trim() || !values.qualification.trim()}>
          {education ? (saving ? "Saving..." : "Save") : (
            <>
              <Plus className="h-4 w-4" />
              {saving ? "Adding..." : "Add education"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function EducationSection({ documentId, educations }: { documentId: string; educations: Education[] }) {
  const [, startMove] = useTransition();

  function move(id: string, direction: "up" | "down") {
    startMove(async () => {
      try {
        await moveEducation(documentId, id, direction);
      } catch {
        toast.error("Failed to reorder");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Education</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {educations.map((edu, index) => (
          <div key={edu.id} className="space-y-2 rounded-lg border p-3">
            <EducationForm documentId={documentId} education={edu} />
            <div className="flex items-center justify-between border-t pt-2">
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === 0}
                  onClick={() => move(edu.id, "up")}
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === educations.length - 1}
                  onClick={() => move(edu.id, "down")}
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <DeleteButton
                action={() => removeEducation(documentId, edu.id)}
                label={`Delete ${edu.institution || "this education entry"}`}
                redirectTo={`/documents/${documentId}/builder`}
              />
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-dashed p-3">
          <EducationForm documentId={documentId} />
        </div>
      </CardContent>
    </Card>
  );
}
