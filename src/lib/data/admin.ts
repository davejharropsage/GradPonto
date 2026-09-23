import { requireAdmin, adminDb } from "@/lib/auth/admin";

/** The most recent admin actions, newest first. */
export async function getAuditLog(limit = 200) {
  await requireAdmin();
  return adminDb.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
