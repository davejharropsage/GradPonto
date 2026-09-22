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
      contactName: toNullable(parsed.contactName),
      contactRole: toNullable(parsed.contactRole),
      contactEmail: toNullable(parsed.contactEmail),
      contactPhone: toNullable(parsed.contactPhone),
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
      contactName: toNullable(parsed.contactName),
      contactRole: toNullable(parsed.contactRole),
      contactEmail: toNullable(parsed.contactEmail),
      contactPhone: toNullable(parsed.contactPhone),
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

// Reassigns every application from `sourceId` to `targetId`, then removes the now-empty source
// employer. Applications are never lost; the source employer's own notes/website/industry are
// discarded since they can't be reconciled automatically. Contact details are the one exception:
// the target's own contact fields win where it has them, otherwise the source's fill the gap —
// unlike notes/website/industry, a missing contact field is unambiguously "nothing to lose" by
// preferring whichever employer actually had it set.
export async function mergeEmployers(sourceId: string, targetId: string) {
  const db = await userDb();
  if (sourceId === targetId) throw new Error("Can't merge an employer into itself");

  // Both ids come from the browser. Confirm they're this user's own, so applications can
  // never be re-pointed at (or deleted from) someone else's employer.
  const [source, target] = await Promise.all([
    db.employer.findUniqueOrThrow({ where: { id: sourceId } }),
    db.employer.findUniqueOrThrow({ where: { id: targetId } }),
  ]);

  await db.$transaction([
    db.application.updateMany({ where: { employerId: sourceId }, data: { employerId: targetId } }),
    db.employer.update({
      where: { id: targetId },
      data: {
        contactName: target.contactName ?? source.contactName,
        contactRole: target.contactRole ?? source.contactRole,
        contactEmail: target.contactEmail ?? source.contactEmail,
        contactPhone: target.contactPhone ?? source.contactPhone,
      },
    }),
    db.employer.delete({ where: { id: sourceId } }),
  ]);

  revalidatePath("/employers");
  revalidatePath(`/employers/${targetId}`);
}
