"use server";

import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validations";

export async function createSignup(formData: FormData) {
  const parsed = signupSchema.parse(Object.fromEntries(formData));

  await db.signup.upsert({
    where: { email: parsed.email },
    create: { name: parsed.name, email: parsed.email, plan: parsed.plan },
    update: { name: parsed.name, plan: parsed.plan },
  });

  // Single-user local app: a sign-up also becomes "the" local profile, so the
  // plan choice is reflected immediately in the app's own upgrade UI.
  await db.profile.upsert({
    where: { id: "default" },
    create: { id: "default", name: parsed.name, plan: parsed.plan },
    update: { name: parsed.name, plan: parsed.plan },
  });

  return { ok: true };
}
