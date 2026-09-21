"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRegisteredUser } from "@/lib/auth/user";
import { updatePlan, updateProfileDetails } from "@/lib/auth/account";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  university: z.string().trim().min(1, "Enter your university.").max(120),
});

export async function updateProfile(formData: FormData) {
  const user = await requireRegisteredUser();
  const parsed = profileSchema.parse({ name: formData.get("name"), university: formData.get("university") });

  await updateProfileDetails(user.id, parsed);

  revalidatePath("/");
  revalidatePath("/account");
}

export async function setPlan(plan: "FREE" | "PRO") {
  const user = await requireRegisteredUser();
  await updatePlan(user.id, plan === "PRO" ? "PRO" : "FREE");

  revalidatePath("/");
  revalidatePath("/account");
}
