"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validations";

export async function updateProfile(formData: FormData) {
  const parsed = profileSchema.parse(Object.fromEntries(formData));

  await db.profile.upsert({
    where: { id: "default" },
    create: { id: "default", name: parsed.name || null },
    update: { name: parsed.name || null },
  });

  revalidatePath("/");
  revalidatePath("/account");
}

export async function setPlan(plan: "FREE" | "PRO") {
  await db.profile.upsert({
    where: { id: "default" },
    create: { id: "default", plan },
    update: { plan },
  });

  revalidatePath("/");
  revalidatePath("/account");
}
