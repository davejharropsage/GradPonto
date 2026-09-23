"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { toast } from "sonner";
import { updateActivity } from "@/lib/actions/activities";
import { activityTypeLabels } from "@/lib/labels";
import { toDatetimeLocalValue } from "@/lib/format";
import type { Activity } from "@/generated/prisma/client";

const editableTypes = Object.entries(activityTypeLabels).filter(([value]) => value !== "STATUS_CHANGE");

export function EditActivityDialog({ activity }: { activity: Activity }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const dueDateValue = activity.dueDate ? toDatetimeLocalValue(activity.dueDate) : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button type="button" aria-label="Edit this activity" className="rounded p-1 hover:bg-accent hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit activity</DialogTitle>
        </DialogHeader>
        <form
          key={`${activity.id}-${activity.updatedAt.getTime()}`}
          action={(formData) =>
            startTransition(async () => {
              try {
                await updateActivity(activity.id, formData);
                toast.success("Saved");
                setOpen(false);
              } catch {
                toast.error("Failed to save");
              }
            })
          }
          className="grid gap-4"
        >
          <input type="hidden" name="applicationId" value={activity.applicationId ?? ""} />
          <div className="grid gap-1.5">
            <Label htmlFor="edit-type">Type</Label>
            <Select name="type" defaultValue={activity.type}>
              <SelectTrigger id="edit-type" className="w-full">
                <SelectValue>{(value: string) => activityTypeLabels[value] ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {editableTypes.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-subject">Subject</Label>
            <Input id="edit-subject" name="subject" defaultValue={activity.subject} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-dueDate">Due date</Label>
            <Input id="edit-dueDate" name="dueDate" type="datetime-local" defaultValue={dueDateValue} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-location">Location</Label>
            <Input id="edit-location" name="location" placeholder="Zoom, Teams, an address..." defaultValue={activity.location ?? ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" name="notes" rows={3} defaultValue={activity.notes ?? ""} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
