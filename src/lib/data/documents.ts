import { userDb } from "@/lib/auth/user";

export async function getBaseDocuments() {
  const db = await userDb();
  return db.document.findMany({
    where: { isBase: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDocument(id: string) {
  const db = await userDb();
  return db.document.findUnique({ where: { id } });
}

// The CV builder's own read: a structured Document with every section, in display order.
export async function getStructuredDocument(id: string) {
  const db = await userDb();
  return db.document.findUnique({
    where: { id },
    include: {
      experiences: { orderBy: { order: "asc" } },
      educations: { orderBy: { order: "asc" } },
      skills: { orderBy: { order: "asc" } },
      projects: { orderBy: { order: "asc" } },
    },
  });
}

// Every CV on file (base + tailored per-application copies), for the Application Reviewer's picker.
export async function getAllCvDocuments() {
  const db = await userDb();
  return db.document.findMany({
    where: { kind: "CV" },
    include: { application: { include: { employer: true } } },
    orderBy: { updatedAt: "desc" },
  });
}
