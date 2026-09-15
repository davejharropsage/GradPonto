"use server";

import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validations";

function toNullable(value: string | undefined) {
  return value && value.trim() !== "" ? value.trim() : null;
}

export async function createSignup(formData: FormData) {
  const parsed = signupSchema.parse(Object.fromEntries(formData));
  const utmSource = toNullable(parsed.utmSource);
  const utmMedium = toNullable(parsed.utmMedium);
  const utmCampaign = toNullable(parsed.utmCampaign);

  await db.signup.upsert({
    where: { email: parsed.email },
    create: { name: parsed.name, email: parsed.email, plan: parsed.plan, utmSource, utmMedium, utmCampaign },
    update: { name: parsed.name, plan: parsed.plan, utmSource, utmMedium, utmCampaign },
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
