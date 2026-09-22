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

// The "Build from sections" alternative to createBaseDocument: an empty structured CV, filled
// in on the builder page rather than pasted as one block. Returns the new document (rather than
// just revalidating) so the caller can route straight to its builder page.
export async function createStructuredCv(formData: FormData) {
  const db = await userDb();
  const name = documentNameSchema.parse({ name: formData.get("name") }).name;

  const document = await db.document.create({
    data: { kind: "CV", isBase: true, isStructured: true, name: name || null, content: "" },
  });

  revalidatePath("/documents");
  return document;
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
    db.document.findUniqueOrThrow({
      where: { id: baseDocumentId },
      include: { experiences: true, educations: true, skills: true, projects: true },
    }),
    // The application id comes from the browser: confirm it's this user's own before attaching to it.
    db.application.findUniqueOrThrow({ where: { id: applicationId }, select: { id: true } }),
  ]);

  const document = await db.document.create({
    data: {
      kind: base.kind,
      isBase: false,
      content: base.content,
      generatedByAI: false,
      isStructured: base.isStructured,
      headline: base.headline,
      summary: base.summary,
      applicationId,
    },
  });

  // A structured base CV stays editable in the builder as a tailored copy too — deep-copy its
  // sections rather than flattening them away. An AI-tailored copy (generateTailoredDocument,
  // below) never does this: its output is prose the model wrote, not structured fields.
  if (base.isStructured) {
    await db.$transaction([
      ...base.experiences.map((e) =>
        db.experience.create({
          data: {
            documentId: document.id,
            title: e.title,
            employer: e.employer,
            location: e.location,
            startDate: e.startDate,
            endDate: e.endDate,
            current: e.current,
            bullets: e.bullets,
            order: e.order,
          },
        })
      ),
      ...base.educations.map((e) =>
        db.education.create({
          data: {
            documentId: document.id,
            institution: e.institution,
            qualification: e.qualification,
            field: e.field,
            startDate: e.startDate,
            endDate: e.endDate,
            grade: e.grade,
            order: e.order,
          },
        })
      ),
      ...base.skills.map((s) => db.skill.create({ data: { documentId: document.id, name: s.name, order: s.order } })),
      ...base.projects.map((p) =>
        db.project.create({
          data: { documentId: document.id, name: p.name, description: p.description, link: p.link, order: p.order },
        })
      ),
    ]);
  }

  revalidatePath(`/applications/${applicationId}`);
  return document;
}

export async function generateTailoredDocument(
  baseDocumentId: string,
  applicationId: string,
  templateKey?: string,
  cvContent?: string
) {
  await requireAiAllowance();
  const db = await userDb();
  const [base, application] = await Promise.all([
    db.document.findUniqueOrThrow({ where: { id: baseDocumentId } }),
    db.application.findUniqueOrThrow({ where: { id: applicationId }, include: { employer: true } }),
  ]);

  // A cover letter should draw on the candidate's actual CV, not just restyle its own base text
  // for a new employer name. The Application Reviewer's Cover Letter tab lets you pick exactly
  // which CV to use; a caller that doesn't supply one (e.g. the quick "Add Document" dialog on
  // an application page) still gets a sensible default: the most recently updated base CV.
  let effectiveCvContent = cvContent?.trim() || undefined;
  if (base.kind === "COVER_LETTER" && !effectiveCvContent) {
    const fallbackCv = await db.document.findFirst({
      where: { kind: "CV", isBase: true },
      orderBy: { updatedAt: "desc" },
    });
    effectiveCvContent = fallbackCv?.content;
  }

  const tailoredContent = await tailorDocument({
    kind: base.kind,
    baseContent: base.content,
    jobTitle: application.title,
    employerName: application.employer?.name,
    jobDescription: application.description,
    templateKey,
    cvContent: base.kind === "COVER_LETTER" ? effectiveCvContent : null,
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
