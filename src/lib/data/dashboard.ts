import { db } from "@/lib/db";

const OPEN_STATUSES = ["SAVED", "DRAFTING", "APPLIED", "IN_REVIEW", "INTERVIEW"] as const;

export async function getDashboardStats() {
  const [total, byStatus] = await Promise.all([
    db.application.count(),
    db.application.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(byStatus.map((row) => [row.status, row._count._all]));
  const openApplications = OPEN_STATUSES.reduce((sum, status) => sum + (statusCounts[status] ?? 0), 0);
  const interviews = statusCounts["INTERVIEW"] ?? 0;
  const offers = statusCounts["OFFER"] ?? 0;

  return { total, openApplications, interviews, offers, statusCounts };
}

export function getUpcomingDeadlines(limit = 8) {
  return db.application.findMany({
    where: {
      deadline: { gte: new Date() },
      status: { notIn: ["REJECTED", "WITHDRAWN", "OFFER"] },
    },
    orderBy: { deadline: "asc" },
    take: limit,
    include: { employer: true },
  });
}

export function getRecentActivity(limit = 8) {
  return db.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { application: { include: { employer: true } } },
  });
}

export function getRecentApplications(limit = 5) {
  return db.application.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { employer: true },
  });
}
