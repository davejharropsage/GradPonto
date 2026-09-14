"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applicationStatusLabels, priorityLabels } from "@/lib/labels";
import type { Application, Employer } from "@/generated/prisma/client";

export interface ApplicationFormInitial {
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  deadline?: string; // ISO date
  description?: string;
  jobUrl?: string;
}

export function ApplicationForm({
  action,
  application,
  employers,
  initial,
}: {
  action: (formData: FormData) => void;
  application?: (Application & { employer: Employer | null }) | null;
  employers: { id: string; name: string }[];
  initial?: ApplicationFormInitial;
}) {
  const deadlineValue = application?.deadline
    ? new Date(application.deadline).toISOString().slice(0, 10)
    : (initial?.deadline ?? "");

  return (
    <form action={action} className="grid max-w-2xl gap-4">
      <datalist id="employer-names">
        {employers.map((employer) => (
          <option key={employer.id} value={employer.name} />
        ))}
      </datalist>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="title">Job title *</Label>
          <Input id="title" name="title" defaultValue={application?.title ?? initial?.title} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            name="company"
            list="employer-names"
            defaultValue={application?.employer?.name ?? initial?.company}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={application?.location ?? initial?.location ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="salary">Salary / stipend</Label>
          <Input id="salary" name="salary" placeholder="e.g. £24,000" defaultValue={application?.salary ?? initial?.salary ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="jobUrl">Job listing URL</Label>
          <Input id="jobUrl" name="jobUrl" defaultValue={application?.jobUrl ?? initial?.jobUrl ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="source">Source</Label>
          <Input id="source" name="source" placeholder="e.g. university portal, LinkedIn" defaultValue={application?.source ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={application?.status ?? "INTERESTED"}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue>{(value: string) => applicationStatusLabels[value] ?? value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(applicationStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue={application?.priority ?? "MEDIUM"}>
            <SelectTrigger id="priority" className="w-full">
              <SelectValue>{(value: string) => priorityLabels[value] ?? value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="deadline">Application deadline</Label>
          <Input id="deadline" name="deadline" type="date" defaultValue={deadlineValue} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Job description</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={application?.description ?? initial?.description ?? ""}
          placeholder="Paste the job posting here — used as input when tailoring your CV and cover letter."
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={application?.notes ?? ""} />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit">{application ? "Save Changes" : "Create Application"}</Button>
      </div>
    </form>
  );
}
