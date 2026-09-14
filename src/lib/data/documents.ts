import { db } from "@/lib/db";

export function getBaseDocuments() {
  return db.document.findMany({
    where: { isBase: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function getDocument(id: string) {
  return db.document.findUnique({ where: { id } });
}

// Every CV on file (base + tailored per-application copies), for the "Check My CV" picker.
export function getAllCvDocuments() {
  return db.document.findMany({
    where: { kind: "CV" },
    include: { application: { include: { employer: true } } },
    orderBy: { updatedAt: "desc" },
  });
}
