"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { userDb } from "@/lib/auth/user";

const dateLike = z.union([z.string(), z.date()]).nullable().optional();

const documentSchema = z.object({
  id: z.string(),
  kind: z.string(),
  isBase: z.boolean(),
  content: z.string(),
  generatedByAI: z.boolean(),
  applicationId: z.string().nullable().optional(),
  createdAt: dateLike,
  updatedAt: dateLike,
});

const activitySchema = z.object({
  id: z.string(),
  type: z.string(),
  subject: z.string(),
  notes: z.string().nullable().optional(),
  dueDate: dateLike,
  completedAt: dateLike,
  applicationId: z.string().nullable().optional(),
  createdAt: dateLike,
  updatedAt: dateLike,
});

const employerSchema = z.object({
  id: z.string(),
  name: z.string(),
  website: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: dateLike,
  updatedAt: dateLike,
});

const applicationSchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string().nullable().optional(),
  jobUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  deadline: dateLike,
  status: z.string(),
  priority: z.string(),
  appliedAt: dateLike,
  notes: z.string().nullable().optional(),
  archived: z.boolean().optional(),
  employerId: z.string().nullable().optional(),
  documents: z.array(documentSchema).optional(),
  activities: z.array(activitySchema).optional(),
  createdAt: dateLike,
  updatedAt: dateLike,
});

const goalSchema = z.object({
  id: z.string(),
  target: z.number(),
  startDate: dateLike,
  endDate: dateLike,
  createdAt: dateLike,
});

const backupSchema = z.object({
  version: z.number(),
  exportedAt: z.string().optional(),
  profile: z.object({ name: z.string().nullable().optional(), plan: z.string().optional() }).nullable().optional(),
  employers: z.array(employerSchema).default([]),
  applications: z.array(applicationSchema).default([]),
  baseDocuments: z.array(documentSchema).default([]),
  goals: z.array(goalSchema).default([]),
});

function toDateOrNow(value: string | Date | null | undefined) {
  if (!value) return new Date();
  const date = new Date(value);
  return isNaN(date.getTime()) ? new Date() : date;
}

function toDateOrNull(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

// Restores a backup produced by /api/backup/export. Always merges as new
// records with freshly-generated ids — never overwrites or deletes existing
// data, so restoring is safe to run more than once or against a non-empty
// database (e.g. combining a backup from another device).
export async function restoreBackupData(jsonText: string) {
  const db = await userDb();
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }

  const backup = backupSchema.parse(parsed);

  const result = await db.$transaction(async (tx) => {
    const employerIdMap = new Map<string, string>();
    for (const employer of backup.employers) {
      const created = await tx.employer.create({
        data: {
          name: employer.name,
          website: employer.website || null,
          industry: employer.industry || null,
          notes: employer.notes || null,
          createdAt: toDateOrNow(employer.createdAt),
        },
      });
      employerIdMap.set(employer.id, created.id);
    }

    let applicationsCreated = 0;
    let documentsCreated = 0;
    let activitiesCreated = 0;

    for (const application of backup.applications) {
      const newEmployerId = application.employerId ? employerIdMap.get(application.employerId) : undefined;

      const created = await tx.application.create({
        data: {
          title: application.title,
          location: application.location || null,
          jobUrl: application.jobUrl || null,
          description: application.description || null,
          source: application.source || null,
          salary: application.salary || null,
          deadline: toDateOrNull(application.deadline),
          status: application.status as never,
          priority: application.priority as never,
          appliedAt: toDateOrNull(application.appliedAt),
          notes: application.notes || null,
          archived: application.archived ?? false,
          employerId: newEmployerId ?? null,
          createdAt: toDateOrNow(application.createdAt),
        },
      });
      applicationsCreated++;

      for (const doc of application.documents ?? []) {
        await tx.document.create({
          data: {
            kind: doc.kind as never,
            isBase: doc.isBase,
            content: doc.content,
            generatedByAI: doc.generatedByAI,
            applicationId: created.id,
            createdAt: toDateOrNow(doc.createdAt),
          },
        });
        documentsCreated++;
      }

      for (const activity of application.activities ?? []) {
        await tx.activity.create({
          data: {
            type: activity.type as never,
            subject: activity.subject,
            notes: activity.notes || null,
            dueDate: toDateOrNull(activity.dueDate),
            completedAt: toDateOrNull(activity.completedAt),
            applicationId: created.id,
            createdAt: toDateOrNow(activity.createdAt),
          },
        });
        activitiesCreated++;
      }
    }

    for (const doc of backup.baseDocuments) {
      await tx.document.create({
        data: {
          kind: doc.kind as never,
          isBase: true,
          content: doc.content,
          generatedByAI: doc.generatedByAI,
          applicationId: null,
          createdAt: toDateOrNow(doc.createdAt),
        },
      });
      documentsCreated++;
    }

    for (const goal of backup.goals) {
      await tx.goal.create({
        data: {
          target: goal.target,
          startDate: toDateOrNow(goal.startDate),
          endDate: toDateOrNow(goal.endDate),
          createdAt: toDateOrNow(goal.createdAt),
        },
      });
    }


    return {
      employers: employerIdMap.size,
      applications: applicationsCreated,
      documents: documentsCreated,
      activities: activitiesCreated,
      goals: backup.goals.length,
    };
  });

  revalidatePath("/applications");
  revalidatePath("/employers");
  revalidatePath("/pipeline");
  revalidatePath("/deadlines");
  revalidatePath("/goals");
  revalidatePath("/");

  return result;
}
