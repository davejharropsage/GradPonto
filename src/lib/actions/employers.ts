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
