"use server";

import { revalidatePath } from "next/cache";
import { userDb } from "@/lib/auth/user";
import { documentSchema } from "@/lib/validations";
import { tailorDocument } from "@/lib/ai/tailor";

export async function createBaseDocument(kind: "CV" | "COVER_LETTER", formData: FormData) {
  const db = await userDb();
  const parsed = documentSchema.parse({ content: formData.get("content") });

  await db.document.create({
    data: { kind, isBase: true, content: parsed.content },
  });

  revalidatePath("/documents");
}

export async function updateDocumentContent(id: string, formData: FormData) {
  const db = await userDb();
  const parsed = documentSchema.parse({ content: formData.get("content") });

  const document = await db.document.update({
    where: { id },
    data: { content: parsed.content },
  });

  revalidatePath("/documents");
  if (document.applicationId) revalidatePath(`/applications/${document.applicationId}`);
  return document;
}

export async function duplicateDocumentForApplication(baseDocumentId: string, applicationId: string) {
  const db = await userDb();
  const [base] = await Promise.all([
    db.document.findUniqueOrThrow({ where: { id: baseDocumentId } }),
    // The application id comes from the browser: confirm it's this user's own before attaching to it.
    db.application.findUniqueOrThrow({ where: { id: applicationId }, select: { id: true } }),
  ]);

  const document = await db.document.create({
    data: {
      kind: base.kind,
      isBase: false,
      content: base.content,
      generatedByAI: false,
      applicationId,
    },
  });

  revalidatePath(`/applications/${applicationId}`);
  return document;
}

export async function generateTailoredDocument(baseDocumentId: string, applicationId: string) {
  const db = await userDb();
  const [base, application] = await Promise.all([
    db.document.findUniqueOrThrow({ where: { id: baseDocumentId } }),
    db.application.findUniqueOrThrow({ where: { id: applicationId }, include: { employer: true } }),
  ]);

  const tailoredContent = await tailorDocument({
    kind: base.kind,
    baseContent: base.content,
    jobTitle: application.title,
    employerName: application.employer?.name,
    jobDescription: application.description,
  });

  const document = await db.document.create({
    data: {
      kind: base.kind,
      isBase: false,
      content: tailoredContent,
      generatedByAI: true,
      applicationId,
    },
  });

  revalidatePath(`/applications/${applicationId}`);
  return document;
}

export async function deleteDocument(id: string) {
  const db = await userDb();
  const document = await db.document.delete({ where: { id } });
  revalidatePath("/documents");
  if (document.applicationId) revalidatePath(`/applications/${document.applicationId}`);
}
