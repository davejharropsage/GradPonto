import { db } from "@/lib/db";
import { applicationStatuses } from "@/lib/labels";

const PAGE_SIZE = 20;

export async function getApplications(params: {
  q?: string;
  status?: string;
  archived?: boolean;
  page?: number;
}) {
  const page = params.page && params.page > 0 ? params.page : 1;

  // A search should be able to find an archived application too — "archived"
  // means hidden from the default browse view, not unsearchable. Only the
  // unfiltered default listing hides archived applications.
  const includeArchived = params.archived || Boolean(params.q?.trim());

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
      includeArchived ? {} : { archived: false },
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
    db.application.count({ where: { archived: true } }),
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
// for a company that already has one on record.
export async function getActiveApplicationSummaries(excludeId?: string) {
  const applications = await db.application.findMany({
    where: {
      archived: false,
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
    where: { archived: false },
    select: { id: true, title: true, employer: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

// All applications grouped by status, for the Pipeline kanban board. Archived
// applications don't belong on an active board, even if their status would
// otherwise place them in a column.
export async function getApplicationsByStatus() {
  const applications = await db.application.findMany({
    where: { archived: false },
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
      archived: false,
    },
    include: { employer: true },
    orderBy: { deadline: "asc" },
  });

  const overdue = applications.filter((a) => a.deadline! < now);
  const dueSoon = applications.filter((a) => a.deadline! >= now && a.deadline! <= in30Days);
  const later = applications.filter((a) => a.deadline! > in30Days);

  return { overdue, dueSoon, later };
}
