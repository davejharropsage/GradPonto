"use server";

import { db } from "@/lib/db";

export interface SearchResults {
  applications: { id: string; title: string; employerName: string | null }[];
  employers: { id: string; name: string }[];
}

export async function getSearchIndex(): Promise<SearchResults> {
  const [applications, employers] = await Promise.all([
    db.application.findMany({
      select: { id: true, title: true, employer: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    db.employer.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  return {
    applications: applications.map((a) => ({ id: a.id, title: a.title, employerName: a.employer?.name ?? null })),
    employers,
  };
}
