"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { employerSchema } from "@/lib/validations";

function toNullable(value: string | undefined) {
  return value && value.trim() !== "" ? value.trim() : null;
}

export async function createEmployer(formData: FormData) {
  const parsed = employerSchema.parse(Object.fromEntries(formData));

  const employer = await db.employer.create({
    data: {
      name: parsed.name,
      website: toNullable(parsed.website),
      industry: toNullable(parsed.industry),
      notes: toNullable(parsed.notes),
    },
  });

  revalidatePath("/employers");
  redirect(`/employers/${employer.id}`);
}

export async function updateEmployer(id: string, formData: FormData) {
  const parsed = employerSchema.parse(Object.fromEntries(formData));

  await db.employer.update({
    where: { id },
    data: {
      name: parsed.name,
      website: toNullable(parsed.website),
      industry: toNullable(parsed.industry),
      notes: toNullable(parsed.notes),
    },
  });

  revalidatePath("/employers");
  revalidatePath(`/employers/${id}`);
  redirect(`/employers/${id}`);
}

export async function deleteEmployer(id: string) {
  await db.employer.delete({ where: { id } });
  revalidatePath("/employers");
}

// Reassigns every application from `sourceId` to `targetId`, then removes
// the now-empty source employer. Applications are never lost; the source
// employer's own notes/website/industry are discarded since they can't be
// reconciled automatically.
export async function mergeEmployers(sourceId: string, targetId: string) {
  if (sourceId === targetId) throw new Error("Can't merge an employer into itself");

  await db.$transaction([
    db.application.updateMany({ where: { employerId: sourceId }, data: { employerId: targetId } }),
    db.employer.delete({ where: { id: sourceId } }),
  ]);

  revalidatePath("/employers");
  revalidatePath(`/employers/${targetId}`);
}
