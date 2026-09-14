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
