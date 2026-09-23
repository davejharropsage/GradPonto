"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireAdmin, adminDb, logAdminAction } from "@/lib/auth/admin";
import { AUTH, cookiesAreSecure } from "@/lib/auth/config";

export async function suspendUser(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("You can't suspend your own account.");

  const target = await adminDb.user.update({ where: { id: userId }, data: { suspendedAt: new Date() } });
  // Belt and braces: don't wait for their next request to hit the suspendedAt check.
  await adminDb.session.deleteMany({ where: { userId } });
  await logAdminAction(admin, "user.suspend", { id: target.id, email: target.email });

  revalidatePath("/admin");
}

export async function reinstateUser(userId: string) {
  const admin = await requireAdmin();
  const target = await adminDb.user.update({ where: { id: userId }, data: { suspendedAt: null } });
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
