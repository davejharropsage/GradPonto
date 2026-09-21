"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { userDb } from "@/lib/auth/user";
import { employerSchema } from "@/lib/validations";

function toNullable(value: string | undefined) {
  return value && value.trim() !== "" ? value.trim() : null;
}

export async function createEmployer(formData: FormData) {
  const db = await userDb();
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
  const db = await userDb();
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
  const db = await userDb();
  await db.employer.delete({ where: { id } });
  revalidatePath("/employers");
}

// Reassigns every application from `sourceId` to `targetId`, then removes
// the now-empty source employer. Applications are never lost; the source
// employer's own notes/website/industry are discarded since they can't be
// reconciled automatically.
export async function mergeEmployers(sourceId: string, targetId: string) {
  const db = await userDb();
  if (sourceId === targetId) throw new Error("Can't merge an employer into itself");

  // Both ids come from the browser. Confirm they're this user's own, so applications can
  // never be re-pointed at (or deleted from) someone else's employer.
  await Promise.all([
    db.employer.findUniqueOrThrow({ where: { id: sourceId }, select: { id: true } }),
    db.employer.findUniqueOrThrow({ where: { id: targetId }, select: { id: true } }),
  ]);

  await db.$transaction([
    db.application.updateMany({ where: { employerId: sourceId }, data: { employerId: targetId } }),
    db.employer.delete({ where: { id: sourceId } }),
  ]);

  revalidatePath("/employers");
  revalidatePath(`/employers/${targetId}`);
}
