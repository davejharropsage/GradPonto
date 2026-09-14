import { db } from "@/lib/db";
import { applicationStatuses } from "@/lib/labels";

const PAGE_SIZE = 20;

export async function getApplications(params: {
  q?: string;
  status?: string;
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
      params.status ? { status: params.status as never } : {},
    ],
  };

  const [applications, total] = await Promise.all([
    db.application.findMany({
      where,
      include: { employer: true },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.application.count({ where }),
  ]);

  return {
    applications,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
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
