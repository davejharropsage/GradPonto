import { db } from "@/lib/db";
import { applicationStatuses } from "@/lib/labels";

const PAGE_SIZE = 20;

// Statuses hidden from the default applications list once an application has
// closed out, so the active pipeline doesn't stay cluttered with old
// rejections. They're never deleted, just filtered out unless requested.
const archivedStatuses = ["REJECTED", "WITHDRAWN"] as const;

export async function getApplications(params: {
  q?: string;
  status?: string;
  archived?: boolean;
  page?: number;
}) {
  const page = params.page && params.page > 0 ? params.page : 1;

  const where = {
    AND: [
      params.q
        ? {
            OR: [
              { title: { contains: params.q } },
              { employer: { name: { contains: params.q } } },
              { location: { contains: params.q } },
            ],
          }
        : {},
      params.status
        ? { status: params.status as never }
        : params.archived
          ? {}
          : { status: { notIn: [...archivedStatuses] } },
    ],
  };

  const [applications, total, archivedCount] = await Promise.all([
    db.application.findMany({
      where,
      include: { employer: true },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.application.count({ where }),
    db.application.count({ where: { status: { in: [...archivedStatuses] } } }),
  ]);

  return {
    applications,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    archivedCount,
  };
}

export function getApplication(id: string) {
  return db.application.findUnique({
    where: { id },
    include: {
      employer: true,
      documents: { orderBy: { updatedAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });
}

// Lightweight summary of every non-archived application, used to warn (not
// block) about a likely duplicate when creating or editing an application
// for a company that already has one on record. Uses the same "archived"
// definition as the applications list, not just the open-pipeline statuses,
// since an existing offer at that company is still worth flagging.
export async function getActiveApplicationSummaries(excludeId?: string) {
  const applications = await db.application.findMany({
    where: {
      status: { notIn: [...archivedStatuses] },
      id: excludeId ? { not: excludeId } : undefined,
    },
    select: { id: true, title: true, status: true, employer: { select: { name: true } } },
  });

  return applications.map((application) => ({
    id: application.id,
    title: application.title,
    status: application.status,
    employerName: application.employer?.name ?? "",
  }));
}

export function getApplicationOptions() {
  return db.application.findMany({
    select: { id: true, title: true, employer: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

// All applications grouped by status, for the Pipeline kanban board.
export async function getApplicationsByStatus() {
  const applications = await db.application.findMany({
    include: { employer: true },
    orderBy: { updatedAt: "desc" },
  });

  const grouped = Object.fromEntries(applicationStatuses.map((status) => [status, [] as typeof applications]));
  for (const application of applications) {
    grouped[application.status]?.push(application);
  }
  return grouped;
}

// Applications grouped for the Deadlines page: overdue vs. due within 30 days.
export async function getDeadlinesGrouped() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const applications = await db.application.findMany({
    where: {
      deadline: { not: null },
      status: { notIn: ["REJECTED", "WITHDRAWN", "OFFER"] },
    },
    include: { employer: true },
    orderBy: { deadline: "asc" },
  });

  const overdue = applications.filter((a) => a.deadline! < now);
  const dueSoon = applications.filter((a) => a.deadline! >= now && a.deadline! <= in30Days);
  const later = applications.filter((a) => a.deadline! > in30Days);

  return { overdue, dueSoon, later };
}
