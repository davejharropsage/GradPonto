"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton } from "@/components/shared/delete-button";
import { toast } from "sonner";
import { addProject, updateProject, removeProject, moveProject } from "@/lib/actions/cv-builder";
import { projectFormDefaults } from "@/lib/cv/form-defaults";
import type { Project } from "@/generated/prisma/client";

function ProjectForm({ documentId, project, onAdded }: { documentId: string; project?: Project; onAdded?: () => void }) {
  const defaults = projectFormDefaults(project ?? undefined);
  const [values, setValues] = useState(defaults);
  const [saving, startSaving] = useTransition();
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  function handleSubmit(formData: FormData) {
    startSaving(async () => {
      try {
        if (project) {
          await updateProject(documentId, project.id, formData);
          toast.success("Saved");
        } else {
          await addProject(documentId, formData);
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
      <div className="grid gap-1.5">
        <Label>Project name</Label>
        <Input name="name" value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="Portfolio site" />
      </div>
      <div className="grid gap-1.5">
        <Label>Description</Label>
        <Textarea
          name="description"
          rows={2}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What it does and what you used to build it."
        />
      </div>
      <div className="grid gap-1.5">
        <Label>Link (optional)</Label>
        <Input name="link" value={values.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" />
      </div>
      <div>
        <Button type="submit" size="sm" disabled={saving || !values.name.trim()}>
          {project ? (saving ? "Saving..." : "Save") : (
            <>
              <Plus className="h-4 w-4" />
              {saving ? "Adding..." : "Add project"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function ProjectSection({ documentId, projects }: { documentId: string; projects: Project[] }) {
  const [, startMove] = useTransition();

  function move(id: string, direction: "up" | "down") {
    startMove(async () => {
      try {
        await moveProject(documentId, id, direction);
      } catch {
        toast.error("Failed to reorder");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.map((project, index) => (
          <div key={project.id} className="space-y-2 rounded-lg border p-3">
            <ProjectForm documentId={documentId} project={project} />
            <div className="flex items-center justify-between border-t pt-2">
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === 0}
                  onClick={() => move(project.id, "up")}
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === projects.length - 1}
                  onClick={() => move(project.id, "down")}
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <DeleteButton
                action={() => removeProject(documentId, project.id)}
                label={`Delete ${project.name || "this project"}`}
                redirectTo={`/documents/${documentId}/builder`}
              />
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-dashed p-3">
          <ProjectForm documentId={documentId} />
        </div>
      </CardContent>
    </Card>
  );
}
