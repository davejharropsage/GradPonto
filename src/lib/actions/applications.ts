"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { applicationSchema } from "@/lib/validations";
import { applicationStatusLabels } from "@/lib/labels";

function toNullable(value: string | undefined) {
  return value && value.trim() !== "" ? value.trim() : null;
}

function toDate(value: string | undefined) {
  return value && value.trim() !== "" ? new Date(value) : null;
}

async function upsertEmployerId(name: string) {
  const trimmed = name.trim();
  const existing = await db.employer.findFirst({ where: { name: trimmed } });
  if (existing) return existing.id;
  const created = await db.employer.create({ data: { name: trimmed } });
  return created.id;
}

async function logStatusChange(applicationId: string, from: string, to: string) {
  if (from === to) return;
  await db.activity.create({
    data: {
      type: "STATUS_CHANGE",
      subject: `Status changed: ${applicationStatusLabels[from]} → ${applicationStatusLabels[to]}`,
      applicationId,
    },
  });
}

export async function createApplication(formData: FormData) {
  const parsed = applicationSchema.parse(Object.fromEntries(formData));
  const employerId = await upsertEmployerId(parsed.company);

  const application = await db.application.create({
    data: {
      title: parsed.title,
      location: toNullable(parsed.location),
      jobUrl: toNullable(parsed.jobUrl),
      description: toNullable(parsed.description),
      source: toNullable(parsed.source),
      salary: toNullable(parsed.salary),
      deadline: toDate(parsed.deadline),
      status: parsed.status,
      priority: parsed.priority,
      notes: toNullable(parsed.notes),
      employerId,
      appliedAt: parsed.status === "APPLIED" ? new Date() : null,
    },
  });

  revalidatePath("/applications");
  revalidatePath("/pipeline");
  revalidatePath("/deadlines");
  revalidatePath("/");
  redirect(`/applications/${application.id}`);
}

export async function updateApplication(id: string, formData: FormData) {
  const parsed = applicationSchema.parse(Object.fromEntries(formData));
  const employerId = await upsertEmployerId(parsed.company);

  const existing = await db.application.findUniqueOrThrow({ where: { id } });

  await db.application.update({
    where: { id },
    data: {
      title: parsed.title,
      location: toNullable(parsed.location),
      jobUrl: toNullable(parsed.jobUrl),
      description: toNullable(parsed.description),
      source: toNullable(parsed.source),
      salary: toNullable(parsed.salary),
      deadline: toDate(parsed.deadline),
      status: parsed.status,
      priority: parsed.priority,
      notes: toNullable(parsed.notes),
      employerId,
      appliedAt: parsed.status === "APPLIED" && !existing.appliedAt ? new Date() : existing.appliedAt,
    },
  });

  await logStatusChange(id, existing.status, parsed.status);

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/deadlines");
  revalidatePath("/");
  redirect(`/applications/${id}`);
}

// Used by the Pipeline kanban board's drag-and-drop — updates status only,
// without the redirect a full form submission would trigger.
export async function updateApplicationStatus(id: string, status: string) {
  const parsedStatus = applicationSchema.shape.status.parse(status);
  const existing = await db.application.findUniqueOrThrow({ where: { id } });

  await db.application.update({
    where: { id },
    data: {
      status: parsedStatus,
      appliedAt: parsedStatus === "APPLIED" && !existing.appliedAt ? new Date() : existing.appliedAt,
    },
  });

  await logStatusChange(id, existing.status, parsedStatus);

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/deadlines");
  revalidatePath("/");
}

export async function deleteApplication(id: string) {
  await db.application.delete({ where: { id } });
  revalidatePath("/applications");
  revalidatePath("/pipeline");
  revalidatePath("/deadlines");
  revalidatePath("/");
}

export async function bulkDeleteApplications(ids: string[]) {
  if (ids.length === 0) return;
  await db.application.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/applications");
  revalidatePath("/pipeline");
  revalidatePath("/deadlines");
  revalidatePath("/");
}

export async function bulkUpdateApplicationStatus(ids: string[], status: string) {
  if (ids.length === 0) return;
  const parsedStatus = applicationSchema.shape.status.parse(status);
  const existing = await db.application.findMany({ where: { id: { in: ids } } });

  await db.application.updateMany({
    where: { id: { in: ids } },
    data: { status: parsedStatus },
  });

  // appliedAt and the status-change log need per-row handling, not updateMany.
  await Promise.all(
    existing.map(async (app) => {
      if (parsedStatus === "APPLIED" && !app.appliedAt) {
        await db.application.update({ where: { id: app.id }, data: { appliedAt: new Date() } });
      }
      await logStatusChange(app.id, app.status, parsedStatus);
    })
  );

  revalidatePath("/applications");
  revalidatePath("/pipeline");
  revalidatePath("/deadlines");
  revalidatePath("/");
}
