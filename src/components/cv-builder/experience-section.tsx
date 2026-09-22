"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton } from "@/components/shared/delete-button";
import { toast } from "sonner";
import { addExperience, updateExperience, removeExperience, moveExperience } from "@/lib/actions/cv-builder";
import { experienceFormDefaults } from "@/lib/cv/form-defaults";
import type { Experience } from "@/generated/prisma/client";

function ExperienceForm({
  documentId,
  experience,
  onAdded,
}: {
  documentId: string;
  experience?: Experience;
  /** Set only on the "add new" form — clears the fields after a successful save. */
  onAdded?: () => void;
}) {
  const defaults = experienceFormDefaults(experience ?? undefined);
  const [values, setValues] = useState(defaults);
  const [saving, startSaving] = useTransition();
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  function handleSubmit(formData: FormData) {
    startSaving(async () => {
      try {
        if (experience) {
          await updateExperience(documentId, experience.id, formData);
          toast.success("Saved");
        } else {
          await addExperience(documentId, formData);
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
          <Label>Role</Label>
          <Input name="title" value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="Data Analyst Intern" />
        </div>
        <div className="grid gap-1.5">
          <Label>Employer</Label>
          <Input name="employer" value={values.employer} onChange={(e) => set("employer", e.target.value)} placeholder="Northwind Analytics" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label>Location</Label>
          <Input name="location" value={values.location} onChange={(e) => set("location", e.target.value)} placeholder="London" />
        </div>
        <div className="grid gap-1.5">
          <Label>Start</Label>
          <Input type="month" name="startDate" value={values.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>End</Label>
          <Input
            type="month"
            name="endDate"
            value={values.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            disabled={values.current}
          />
        </div>
      </div>
      <label className="group/field-label flex items-center gap-2 text-sm">
        <Checkbox name="current" checked={values.current} onCheckedChange={(checked) => set("current", checked)} />
        I currently work here
      </label>
      <div className="grid gap-1.5">
        <Label>What you did (one point per line)</Label>
        <Textarea
          name="bullets"
          rows={3}
          value={values.bullets}
          onChange={(e) => set("bullets", e.target.value)}
          placeholder={"Built dashboards used by the analytics team\nWrote SQL queries against production data"}
        />
      </div>
      <div>
        <Button type="submit" size="sm" disabled={saving || !values.title.trim() || !values.employer.trim()}>
          {experience ? (saving ? "Saving..." : "Save") : (
            <>
              <Plus className="h-4 w-4" />
              {saving ? "Adding..." : "Add experience"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function ExperienceSection({ documentId, experiences }: { documentId: string; experiences: Experience[] }) {
  const [, startMove] = useTransition();

  function move(id: string, direction: "up" | "down") {
    startMove(async () => {
      try {
        await moveExperience(documentId, id, direction);
      } catch {
        toast.error("Failed to reorder");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Experience</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {experiences.map((exp, index) => (
          <div key={exp.id} className="space-y-2 rounded-lg border p-3">
            <ExperienceForm documentId={documentId} experience={exp} />
            <div className="flex items-center justify-between border-t pt-2">
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === 0}
                  onClick={() => move(exp.id, "up")}
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === experiences.length - 1}
                  onClick={() => move(exp.id, "down")}
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <DeleteButton
                action={() => removeExperience(documentId, exp.id)}
                label={`Delete ${exp.title || "this experience"}`}
                redirectTo={`/documents/${documentId}/builder`}
              />
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-dashed p-3">
          <ExperienceForm documentId={documentId} />
        </div>
      </CardContent>
    </Card>
  );
}
