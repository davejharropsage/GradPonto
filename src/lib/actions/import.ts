"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { upsertEmployerId } from "@/lib/actions/applications";

export interface ImportRow {
  title: string;
  company: string;
  location?: string;
  status?: string;
  priority?: string;
  archived?: boolean;
  salary?: string;
  source?: string;
  jobUrl?: string;
  deadline?: string;
  appliedAt?: string;
  createdAt?: string;
  notes?: string;
}

function toNullable(value: string | undefined) {
  return value && value.trim() !== "" ? value.trim() : null;
}

function toDate(value: string | undefined) {
  return value && value.trim() !== "" ? new Date(value) : null;
}

export async function bulkImportApplications(rows: ImportRow[]) {
  let created = 0;

  for (const row of rows) {
    if (!row.title?.trim() || !row.company?.trim()) continue;

    const employerId = await upsertEmployerId(row.company);
    const createdAt = toDate(row.createdAt) ?? undefined;

    await db.application.create({
      data: {
        title: row.title.trim(),
        location: toNullable(row.location),
        jobUrl: toNullable(row.jobUrl),
        source: toNullable(row.source),
        salary: toNullable(row.salary),
        deadline: toDate(row.deadline),
        appliedAt: toDate(row.appliedAt),
        status: (row.status as never) ?? "INTERESTED",
        priority: (row.priority as never) ?? "MEDIUM",
        archived: row.archived ?? false,
        notes: toNullable(row.notes),
        employerId,
        ...(createdAt ? { createdAt } : {}),
      },
    });
    created++;
  }

  revalidatePath("/applications");
  revalidatePath("/pipeline");
  revalidatePath("/deadlines");
  revalidatePath("/");

  return { created };
}
