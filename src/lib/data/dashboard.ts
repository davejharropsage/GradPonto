import { db } from "@/lib/db";
import { nextActionLabels } from "@/lib/labels";

export async function getDashboardStats() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [applications, assessments, interviews, offers, deadlinesSoon] = await Promise.all([
    db.application.count(),
    db.application.count({ where: { status: "ONLINE_ASSESSMENT" } }),
    db.application.count({ where: { status: "VIDEO_INTERVIEW" } }),
    db.application.count({ where: { status: "OFFER" } }),
    db.application.count({ where: { deadline: { gte: now, lte: in7Days } } }),
  ]);

  return { applications, assessments, interviews, offers, deadlinesSoon };
}

// The 5-bucket "Your Application Progress" rollup shown on the dashboard.
export async function getProgressBuckets() {
  const byStatus = await db.application.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = Object.fromEntries(byStatus.map((row) => [row.status, row._count._all]));

  return [
    {
      key: "interested",
      label: "Interested",
      count: (counts["INTERESTED"] ?? 0) + (counts["NOT_STARTED"] ?? 0) + (counts["PREPARING"] ?? 0),
      color: "bg-slate-400",
    },
    { key: "applied", label: "Applied", count: counts["APPLIED"] ?? 0, color: "bg-blue-500" },
    { key: "assessment", label: "Assessment", count: counts["ONLINE_ASSESSMENT"] ?? 0, color: "bg-purple-500" },
    { key: "interview", label: "Interview", count: counts["VIDEO_INTERVIEW"] ?? 0, color: "bg-teal-500" },
    { key: "offer", label: "Offer", count: counts["OFFER"] ?? 0, color: "bg-emerald-500" },
  ];
}

// Applications that need action from the user, ranked by priority then deadline.
export async function getNeedsAttention(limit = 4) {
  const applications = await db.application.findMany({
    where: { status: { in: Object.keys(nextActionLabels) as never[] } },
    include: { employer: true },
    orderBy: [{ priority: "desc" }, { deadline: "asc" }],
    take: limit,
  });

  return applications.map((application) => ({
    ...application,
    nextAction: nextActionLabels[application.status] ?? "Review application",
  }));
}

export function getRecentActivity(limit = 8) {
  return db.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { application: { include: { employer: true } } },
  });
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

export function getRecentApplications(limit = 5) {
  return db.application.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { employer: true },
  });
}
