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
import { applicationStatusLabels } from "@/lib/labels";
import type { Application } from "@/generated/prisma/client";

export function ApplicationForm({
  action,
  application,
  employers,
}: {
  action: (formData: FormData) => void;
  application?: Application | null;
  employers: { id: string; name: string }[];
}) {
  const deadlineValue = application?.deadline
    ? new Date(application.deadline).toISOString().slice(0, 10)
    : "";

  const employerNames = Object.fromEntries(employers.map((e) => [e.id, e.name]));

  return (
    <form action={action} className="grid max-w-2xl gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="title">Job title *</Label>
        <Input id="title" name="title" defaultValue={application?.title} required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="employerId">Employer</Label>
          <Select name="employerId" defaultValue={application?.employerId ?? ""}>
            <SelectTrigger id="employerId" className="w-full">
              <SelectValue placeholder="No employer">
                {(value: string) => employerNames[value] ?? "No employer"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {employers.map((employer) => (
                <SelectItem key={employer.id} value={employer.id}>
                  {employer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={application?.location ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="jobUrl">Job listing URL</Label>
          <Input id="jobUrl" name="jobUrl" defaultValue={application?.jobUrl ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="source">Source</Label>
          <Input id="source" name="source" placeholder="e.g. university portal, LinkedIn" defaultValue={application?.source ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={application?.status ?? "SAVED"}>
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
          defaultValue={application?.description ?? ""}
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
