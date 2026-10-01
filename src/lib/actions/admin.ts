"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { requireAdmin, adminDb, logAdminAction } from "@/lib/auth/admin";
import { AUTH, cookiesAreSecure } from "@/lib/auth/config";
import { createUserByAdmin } from "@/lib/auth/account";
import { hashPassword, passwordSchema } from "@/lib/auth/password";

export type AdminFormState = { error?: string } | undefined;

const createUserSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z.string().trim().min(1, "Enter a name.").max(80),
    university: z.string().trim().min(1, "Enter a university.").max(120),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Those passwords don't match.",
    path: ["confirmPassword"],
  });

/**
 * Admin-only: create an account directly, for beta testers or as an override for someone who
 * can't get through the normal signup flow. Skips email verification entirely — an admin setting
 * the password is treated as proof of the address, the same trust level as a verified code.
 * Returns undefined on success (the caller treats that as "done"), {error} otherwise.
 */
export async function createUserAction(formData: FormData): Promise<AdminFormState> {
  const admin = await requireAdmin();

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    name: formData.get("name"),
    university: formData.get("university"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details and try again." };
  const { email, password, name, university } = parsed.data;

  const user = await createUserByAdmin(email, hashPassword(password), { name, university });
  if (!user) return { error: "That email already has an account." };

  await logAdminAction(admin, "user.create", { id: user.id, email: user.email });
  revalidatePath("/admin");
}

export async function suspendUser(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("You can't suspend your own account.");

  // suspendedUntil: null makes this an admin (indefinite) suspension, distinct from a user's own
  // 30-day pause (pauseOwnAccount) — only an admin can lift this one, via reinstateUser below.
  const target = await adminDb.user.update({ where: { id: userId }, data: { suspendedAt: new Date(), suspendedUntil: null } });
  // Belt and braces: don't wait for their next request to hit the suspendedAt check.
  await adminDb.session.deleteMany({ where: { userId } });
  await logAdminAction(admin, "user.suspend", { id: target.id, email: target.email });

  revalidatePath("/admin");
}

export async function reinstateUser(userId: string) {
  const admin = await requireAdmin();
  const target = await adminDb.user.update({ where: { id: userId }, data: { suspendedAt: null, suspendedUntil: null } });
  await logAdminAction(admin, "user.reinstate", { id: target.id, email: target.email });

  revalidatePath("/admin");
}

/** View the app as another user. requireAdmin() ignores this cookie entirely — see user.ts. */
export async function startImpersonation(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("You're already signed in as yourself.");

  const target = await adminDb.user.findUniqueOrThrow({ where: { id: userId } });
  if (target.role === "ADMIN") throw new Error("Can't impersonate another admin.");

  (await cookies()).set(AUTH.impersonateCookie, target.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookiesAreSecure(),
    path: "/",
    // No explicit expiry: clears when the browser closes, on top of the explicit "Return to
    // admin" action — an impersonation session shouldn't quietly outlive either.
  });
  await logAdminAction(admin, "user.impersonate_start", { id: target.id, email: target.email });
}

export async function stopImpersonation() {
  const admin = await requireAdmin();

  const targetId = (await cookies()).get(AUTH.impersonateCookie)?.value;
  (await cookies()).delete(AUTH.impersonateCookie);

  if (targetId) {
    const target = await adminDb.user.findUnique({ where: { id: targetId } });
    if (target) await logAdminAction(admin, "user.impersonate_stop", { id: target.id, email: target.email });
  }
}
