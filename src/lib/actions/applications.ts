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

export async function createApplication(formData: FormData) {
  const parsed = applicationSchema.parse(Object.fromEntries(formData));

  const application = await db.application.create({
    data: {
      title: parsed.title,
      location: toNullable(parsed.location),
      jobUrl: toNullable(parsed.jobUrl),
      description: toNullable(parsed.description),
      source: toNullable(parsed.source),
      deadline: toDate(parsed.deadline),
      status: parsed.status,
      notes: toNullable(parsed.notes),
      employerId: toNullable(parsed.employerId),
      appliedAt: parsed.status === "APPLIED" ? new Date() : null,
    },
  });

  revalidatePath("/applications");
  revalidatePath("/");
  redirect(`/applications/${application.id}`);
}

export async function updateApplication(id: string, formData: FormData) {
  const parsed = applicationSchema.parse(Object.fromEntries(formData));

  const existing = await db.application.findUniqueOrThrow({ where: { id } });
  const statusChanged = existing.status !== parsed.status;

  await db.application.update({
    where: { id },
    data: {
      title: parsed.title,
      location: toNullable(parsed.location),
      jobUrl: toNullable(parsed.jobUrl),
      description: toNullable(parsed.description),
      source: toNullable(parsed.source),
      deadline: toDate(parsed.deadline),
      status: parsed.status,
      notes: toNullable(parsed.notes),
      employerId: toNullable(parsed.employerId),
      appliedAt: parsed.status === "APPLIED" && !existing.appliedAt ? new Date() : existing.appliedAt,
    },
  });

  if (statusChanged) {
    await db.activity.create({
      data: {
        type: "STATUS_CHANGE",
        subject: `Status changed: ${applicationStatusLabels[existing.status]} → ${applicationStatusLabels[parsed.status]}`,
        applicationId: id,
      },
    });
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/");
  redirect(`/applications/${id}`);
}

export async function deleteApplication(id: string) {
  await db.application.delete({ where: { id } });
  revalidatePath("/applications");
  revalidatePath("/");
}
