"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRegisteredUser } from "@/lib/auth/user";
import { updatePlan, updateProfileDetails, pauseOwnAccount, deleteOwnAccount } from "@/lib/auth/account";
import { destroySession } from "@/lib/auth/session";

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

/**
 * Pauses the signed-in user's own account for 30 days: signed out everywhere immediately, and
 * blocked from signing back in until they either wait it out or just sign in again with their
 * password, which lifts it early (see signInAction) — a deliberately low-friction "change your
 * mind" path, unlike an admin suspension.
 */
export async function pauseAccountAction() {
  const user = await requireRegisteredUser();
  await pauseOwnAccount(user.id);
  await destroySession();
  redirect("/signin?paused=1");
}

/** Permanently deletes the signed-in user's own account and everything in it. Cannot be undone. */
export async function deleteAccountAction() {
  const user = await requireRegisteredUser();
  await deleteOwnAccount(user.id);
  await destroySession();
  redirect("/signin?deleted=1");
}
