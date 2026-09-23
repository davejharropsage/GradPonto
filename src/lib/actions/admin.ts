"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, adminDb, logAdminAction } from "@/lib/auth/admin";

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
