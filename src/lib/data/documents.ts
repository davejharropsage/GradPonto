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

// Every CV on file (base + tailored per-application copies), for the Application Reviewer's picker.
export async function getAllCvDocuments() {
  const db = await userDb();
  return db.document.findMany({
    where: { kind: "CV" },
    include: { application: { include: { employer: true } } },
    orderBy: { updatedAt: "desc" },
  });
}
