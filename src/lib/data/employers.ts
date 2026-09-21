import { userDb } from "@/lib/auth/user";

const PAGE_SIZE = 20;

export async function getEmployers(params: { q?: string; page?: number }) {
  const db = await userDb();
  const page = params.page && params.page > 0 ? params.page : 1;

  const where = params.q
    ? {
        OR: [
          { name: { contains: params.q } },
          { industry: { contains: params.q } },
        ],
      }
    : {};

  const [employers, total] = await Promise.all([
    db.employer.findMany({
      where,
      include: { _count: { select: { applications: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.employer.count({ where }),
  ]);

  return { employers, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getEmployer(id: string) {
  const db = await userDb();
  return db.employer.findUnique({
    where: { id },
    include: {
      applications: { orderBy: { updatedAt: "desc" } },
    },
  });
}

export async function getEmployerOptions() {
  const db = await userDb();
  return db.employer.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
