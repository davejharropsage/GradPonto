import { db } from "@/lib/db";

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
