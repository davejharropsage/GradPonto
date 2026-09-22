"use server";

import { revalidatePath } from "next/cache";
import { userDb } from "@/lib/auth/user";
import { documentSchema, documentNameSchema } from "@/lib/validations";
import { requireAiAllowance } from "@/lib/ai/limit";
import { tailorDocument } from "@/lib/ai/tailor";

export async function createBaseDocument(kind: "CV" | "COVER_LETTER", formData: FormData) {
  const db = await userDb();
  const content = documentSchema.parse({ content: formData.get("content") }).content;
  const name = documentNameSchema.parse({ name: formData.get("name") }).name;

  await db.document.create({
    data: { kind, isBase: true, name: name || null, content },
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

// A base document's own name only — kept separate from updateDocumentContent so the shared
// content editor (also used for tailored, per-application copies, which have no name of their
// own) never has to reason about a field that doesn't apply to it.
export async function renameDocument(id: string, formData: FormData) {
  const db = await userDb();
  const parsed = documentNameSchema.parse({ name: formData.get("name") });

  const document = await db.document.update({
    where: { id },
    data: { name: parsed.name || null },
  });

  revalidatePath("/documents");
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

export async function generateTailoredDocument(baseDocumentId: string, applicationId: string, templateKey?: string) {
  await requireAiAllowance();
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
    templateKey,
  });

  const document = await db.document.create({
    data: {
      kind: base.kind,
      isBase: false,
      content: tailoredContent,
      generatedByAI: true,
      // Only meaningful for a cover letter — never recorded against a CV, even if a caller passed one.
      templateKey: base.kind === "COVER_LETTER" ? (templateKey ?? null) : null,
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
