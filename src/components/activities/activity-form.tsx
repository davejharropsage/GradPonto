"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createActivity } from "@/lib/actions/activities";
import { activityTypeLabels } from "@/lib/labels";

const loggableTypes = Object.entries(activityTypeLabels).filter(([value]) => value !== "STATUS_CHANGE");

export function ActivityForm({ applicationId }: { applicationId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createActivity(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="applicationId" value={applicationId} />

      <div className="w-full sm:w-36">
        <Select name="type" defaultValue="NOTE">
          <SelectTrigger className="w-full">
            <SelectValue>{(value: string) => activityTypeLabels[value] ?? value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {loggableTypes.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Input name="subject" placeholder="Subject" required className="flex-1" />
      <Input name="location" placeholder="Location" className="w-full sm:w-36" />
      <Input name="dueDate" type="datetime-local" className="w-full sm:w-52" />
      <Button type="submit" size="sm">
        Log
      </Button>
    </form>
  );
}
