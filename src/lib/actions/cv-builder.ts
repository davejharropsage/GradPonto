"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { userDb } from "@/lib/auth/user";
import { serializeStructuredCv } from "@/lib/cv/serialize";

// Every mutation here follows the same shape: confirm the CV belongs to this user (via the
// scoped client — see the ownership note on ownedDocument below), apply the change to a child
// table, then re-derive Document.content from the full structured CV. That's the one thing that
// keeps the builder from causing rework everywhere else: nothing downstream needs to know a CV
// was authored section-by-section rather than pasted in as one block.

const monthInput = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, "Use the month picker")
  .optional()
  .or(z.literal(""));

function toMonthDate(value: string | undefined): Date | null {
  return value ? new Date(`${value}-01T00:00:00.000Z`) : null;
}

/** Confirms `documentId` belongs to this user (a foreign or missing id throws) before any
 * child-table write touches it — the same guard duplicateDocumentForApplication already uses
 * for a browser-supplied applicationId. */
async function ownedDocument(documentId: string) {
  const db = await userDb();
  await db.document.findUniqueOrThrow({ where: { id: documentId } });
  return db;
}

async function resyncContent(documentId: string) {
  const db = await userDb();
  const doc = await db.document.findUniqueOrThrow({
    where: { id: documentId },
    include: {
      experiences: { orderBy: { order: "asc" } },
      educations: { orderBy: { order: "asc" } },
      skills: { orderBy: { order: "asc" } },
      projects: { orderBy: { order: "asc" } },
    },
  });
  const content = serializeStructuredCv(doc);
  await db.document.update({ where: { id: documentId }, data: { content } });
  revalidatePath(`/documents/${documentId}/builder`);
  revalidatePath("/documents");
}

/** Swaps `id`'s position with its neighbour in a list already ordered by `order`. */
function swapNeighbour<T extends { id: string; order: number }>(items: T[], id: string, direction: "up" | "down") {
  const index = items.findIndex((item) => item.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= items.length) return null;
  return { a: items[index], b: items[swapWith] };
}

export async function updateCvHeader(documentId: string, formData: FormData) {
  const parsed = z
    .object({
      headline: z.string().trim().max(200).optional().or(z.literal("")),
      summary: z.string().trim().max(1000).optional().or(z.literal("")),
    })
    .parse({ headline: formData.get("headline"), summary: formData.get("summary") });

  const db = await ownedDocument(documentId);
  await db.document.update({
    where: { id: documentId },
    data: { headline: parsed.headline || null, summary: parsed.summary || null },
  });
  await resyncContent(documentId);
}

// ---------------------------------------------------------------------------------- Experience

const experienceSchema = z.object({
  title: z.string().trim().min(1, "Role title is required").max(150),
  employer: z.string().trim().min(1, "Employer is required").max(150),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  startDate: monthInput,
  endDate: monthInput,
  current: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  bullets: z.string().max(4000).optional().or(z.literal("")),
});

function readExperience(formData: FormData) {
  return experienceSchema.parse({
    title: formData.get("title"),
    employer: formData.get("employer"),
    location: formData.get("location"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    current: formData.get("current"),
    bullets: formData.get("bullets"),
  });
}

export type ExperienceFormValues = z.infer<typeof experienceSchema>;

export async function addExperience(documentId: string, formData: FormData) {
  const parsed = readExperience(formData);
  const db = await ownedDocument(documentId);
  const order = await db.experience.count({ where: { documentId } });
  await db.experience.create({
    data: {
      documentId,
      title: parsed.title,
      employer: parsed.employer,
      location: parsed.location || null,
      startDate: toMonthDate(parsed.startDate),
      endDate: parsed.current ? null : toMonthDate(parsed.endDate),
      current: parsed.current,
      bullets: parsed.bullets ?? "",
      order,
    },
  });
  await resyncContent(documentId);
}

export async function updateExperience(documentId: string, id: string, formData: FormData) {
  const parsed = readExperience(formData);
  const db = await ownedDocument(documentId);
  await db.experience.update({
    where: { id },
    data: {
      title: parsed.title,
      employer: parsed.employer,
      location: parsed.location || null,
      startDate: toMonthDate(parsed.startDate),
      endDate: parsed.current ? null : toMonthDate(parsed.endDate),
      current: parsed.current,
      bullets: parsed.bullets ?? "",
    },
  });
  await resyncContent(documentId);
}

export async function removeExperience(documentId: string, id: string) {
  const db = await ownedDocument(documentId);
  await db.experience.delete({ where: { id } });
  await resyncContent(documentId);
}

export async function moveExperience(documentId: string, id: string, direction: "up" | "down") {
  const db = await ownedDocument(documentId);
  const items = await db.experience.findMany({ where: { documentId }, orderBy: { order: "asc" } });
  const swap = swapNeighbour(items, id, direction);
  if (swap) {
    await db.$transaction([
      db.experience.update({ where: { id: swap.a.id }, data: { order: swap.b.order } }),
      db.experience.update({ where: { id: swap.b.id }, data: { order: swap.a.order } }),
    ]);
  }
  await resyncContent(documentId);
}

// ----------------------------------------------------------------------------------- Education

const educationSchema = z.object({
  institution: z.string().trim().min(1, "Institution is required").max(150),
  qualification: z.string().trim().min(1, "Qualification is required").max(150),
  field: z.string().trim().max(150).optional().or(z.literal("")),
  startDate: monthInput,
  endDate: monthInput,
  grade: z.string().trim().max(60).optional().or(z.literal("")),
});

function readEducation(formData: FormData) {
  return educationSchema.parse({
    institution: formData.get("institution"),
    qualification: formData.get("qualification"),
    field: formData.get("field"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    grade: formData.get("grade"),
  });
}

export async function addEducation(documentId: string, formData: FormData) {
  const parsed = readEducation(formData);
  const db = await ownedDocument(documentId);
  const order = await db.education.count({ where: { documentId } });
  await db.education.create({
    data: {
      documentId,
      institution: parsed.institution,
      qualification: parsed.qualification,
      field: parsed.field || null,
      startDate: toMonthDate(parsed.startDate),
      endDate: toMonthDate(parsed.endDate),
      grade: parsed.grade || null,
      order,
    },
  });
  await resyncContent(documentId);
}

export async function updateEducation(documentId: string, id: string, formData: FormData) {
  const parsed = readEducation(formData);
  const db = await ownedDocument(documentId);
  await db.education.update({
    where: { id },
    data: {
      institution: parsed.institution,
      qualification: parsed.qualification,
      field: parsed.field || null,
      startDate: toMonthDate(parsed.startDate),
      endDate: toMonthDate(parsed.endDate),
      grade: parsed.grade || null,
    },
  });
  await resyncContent(documentId);
}

export async function removeEducation(documentId: string, id: string) {
  const db = await ownedDocument(documentId);
  await db.education.delete({ where: { id } });
  await resyncContent(documentId);
}

export async function moveEducation(documentId: string, id: string, direction: "up" | "down") {
  const db = await ownedDocument(documentId);
  const items = await db.education.findMany({ where: { documentId }, orderBy: { order: "asc" } });
  const swap = swapNeighbour(items, id, direction);
  if (swap) {
    await db.$transaction([
      db.education.update({ where: { id: swap.a.id }, data: { order: swap.b.order } }),
      db.education.update({ where: { id: swap.b.id }, data: { order: swap.a.order } }),
    ]);
  }
  await resyncContent(documentId);
}

// -------------------------------------------------------------------------------------- Skills

// Skills are simpler than the other sections: authored as one comma-separated line (the natural
// way most CVs list them), stored as individual rows for consistency with everything else, and
// replaced wholesale on every save rather than needing separate add/remove/reorder actions.
export async function setSkills(documentId: string, formData: FormData) {
  const raw = String(formData.get("skills") ?? "");
  const seen = new Set<string>();
  const names: string[] = [];
  for (const part of raw.split(",")) {
    const name = part.trim().slice(0, 60);
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
    if (names.length >= 40) break;
  }

  const db = await ownedDocument(documentId);
  await db.$transaction([
    db.skill.deleteMany({ where: { documentId } }),
    ...names.map((name, order) => db.skill.create({ data: { documentId, name, order } })),
  ]);
  await resyncContent(documentId);
}

// -------------------------------------------------------------------------------------- Projects

const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(150),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  link: z.string().trim().max(300).optional().or(z.literal("")),
});

function readProject(formData: FormData) {
  return projectSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    link: formData.get("link"),
  });
}

export async function addProject(documentId: string, formData: FormData) {
  const parsed = readProject(formData);
  const db = await ownedDocument(documentId);
  const order = await db.project.count({ where: { documentId } });
  await db.project.create({
    data: { documentId, name: parsed.name, description: parsed.description || null, link: parsed.link || null, order },
  });
  await resyncContent(documentId);
}

export async function updateProject(documentId: string, id: string, formData: FormData) {
  const parsed = readProject(formData);
  const db = await ownedDocument(documentId);
  await db.project.update({
    where: { id },
    data: { name: parsed.name, description: parsed.description || null, link: parsed.link || null },
  });
  await resyncContent(documentId);
}

export async function removeProject(documentId: string, id: string) {
  const db = await ownedDocument(documentId);
  await db.project.delete({ where: { id } });
  await resyncContent(documentId);
}

export async function moveProject(documentId: string, id: string, direction: "up" | "down") {
  const db = await ownedDocument(documentId);
  const items = await db.project.findMany({ where: { documentId }, orderBy: { order: "asc" } });
  const swap = swapNeighbour(items, id, direction);
  if (swap) {
    await db.$transaction([
      db.project.update({ where: { id: swap.a.id }, data: { order: swap.b.order } }),
      db.project.update({ where: { id: swap.b.id }, data: { order: swap.a.order } }),
    ]);
  }
  await resyncContent(documentId);
}
