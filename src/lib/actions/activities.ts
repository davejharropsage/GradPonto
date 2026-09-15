"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { activitySchema } from "@/lib/validations";

function toNullable(value: string | undefined) {
  return value && value.trim() !== "" ? value.trim() : null;
}

function toDate(value: string | undefined) {
  return value && value.trim() !== "" ? new Date(value) : null;
}

export async function createActivity(formData: FormData) {
  const parsed = activitySchema.parse(Object.fromEntries(formData));

  await db.activity.create({
    data: {
      type: parsed.type,
      subject: parsed.subject,
      notes: toNullable(parsed.notes),
      dueDate: toDate(parsed.dueDate),
      applicationId: parsed.applicationId,
    },
  });

  revalidatePath("/");
  revalidatePath(`/applications/${parsed.applicationId}`);
}

export async function updateActivity(id: string, formData: FormData) {
  const parsed = activitySchema.parse(Object.fromEntries(formData));

  const activity = await db.activity.update({
    where: { id },
    data: {
      type: parsed.type,
      subject: parsed.subject,
      notes: toNullable(parsed.notes),
      dueDate: toDate(parsed.dueDate),
    },
  });

  revalidatePath("/");
  if (activity.applicationId) revalidatePath(`/applications/${activity.applicationId}`);
}

export async function toggleActivityComplete(id: string, completed: boolean) {
  const activity = await db.activity.update({
    where: { id },
    data: { completedAt: completed ? new Date() : null },
  });

  revalidatePath("/");
  if (activity.applicationId) revalidatePath(`/applications/${activity.applicationId}`);
}

export async function deleteActivity(id: string) {
  const activity = await db.activity.delete({ where: { id } });
  revalidatePath("/");
  if (activity.applicationId) revalidatePath(`/applications/${activity.applicationId}`);
}
