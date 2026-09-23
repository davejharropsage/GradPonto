import { requireAdmin, adminDb } from "@/lib/auth/admin";

/** The most recent admin actions, newest first. */
export async function getAuditLog(limit = 200) {
  await requireAdmin();
  return adminDb.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  d.setDate(d.getDate() - 6);
  return d;
}

/** Total users, plus how many registered today and in the last 7 days. */
export async function getAdminOverview() {
  await requireAdmin();
  const [total, today, thisWeek] = await Promise.all([
    adminDb.user.count(),
    adminDb.user.count({ where: { registeredAt: { gte: startOfToday() } } }),
    adminDb.user.count({ where: { registeredAt: { gte: startOfWeek() } } }),
  ]);
  return { total, today, thisWeek };
}

/** Every registered user, newest first, with an application count for an at-a-glance activity signal. */
export async function getAdminUserList() {
  await requireAdmin();
  return adminDb.user.findMany({
    where: { registeredAt: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      university: true,
      role: true,
      registeredAt: true,
      lastLoginAt: true,
      suspendedAt: true,
      _count: { select: { applications: true } },
    },
  });
}

/** How much of the shared AI/Adzuna allowance has been used today and in the last hour. */
export async function getUsageToday() {
  await requireAdmin();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [aiToday, aiLastHour, adzunaToday, adzunaLastHour] = await Promise.all([
    adminDb.usageEvent.count({ where: { kind: "AI", createdAt: { gte: startOfToday() } } }),
    adminDb.usageEvent.count({ where: { kind: "AI", createdAt: { gte: hourAgo } } }),
    adminDb.usageEvent.count({ where: { kind: "ADZUNA", createdAt: { gte: startOfToday() } } }),
    adminDb.usageEvent.count({ where: { kind: "ADZUNA", createdAt: { gte: hourAgo } } }),
  ]);
  return {
    ai: { today: aiToday, lastHour: aiLastHour },
    adzuna: { today: adzunaToday, lastHour: adzunaLastHour },
  };
}
