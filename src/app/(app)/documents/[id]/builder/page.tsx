import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ExportPdfButton } from "@/components/documents/export-pdf-button";
import { DeleteButton } from "@/components/shared/delete-button";
import { CvHeaderForm } from "@/components/cv-builder/cv-header-form";
import { ExperienceSection } from "@/components/cv-builder/experience-section";
import { EducationSection } from "@/components/cv-builder/education-section";
import { SkillsSection } from "@/components/cv-builder/skills-section";
import { ProjectSection } from "@/components/cv-builder/project-section";
import { getStructuredDocument } from "@/lib/data/documents";
import { deleteDocument } from "@/lib/actions/documents";

export default async function CvBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getStructuredDocument(id);
  if (!document || document.kind !== "CV" || !document.isStructured) notFound();

  // A base CV built from the Documents page comes back there; a tailored, per-application copy
  // (duplicated from a structured base — see duplicateDocumentForApplication) goes back to the
  // application it belongs to instead.
  const backHref = document.applicationId ? `/applications/${document.applicationId}` : "/documents";
  const backLabel = document.applicationId ? "Back to application" : "Back to Documents";

  return (
    <div>
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <PageHeader
        title="CV Builder"
        description="Build your CV section by section. Every save updates the plain-text version everything else in GradPonto uses — Application Reviewer, PDF export, tailoring."
        actions={
          <>
            <ExportPdfButton documentId={document.id} />
            <DeleteButton
              action={deleteDocument.bind(null, document.id)}
              label={`Delete ${document.name || "this CV"}`}
              redirectTo={backHref}
            />
          </>
        }
      />

      <div className="grid max-w-3xl gap-4">
        <CvHeaderForm document={document} />
        <ExperienceSection documentId={document.id} experiences={document.experiences} />
        <EducationSection documentId={document.id} educations={document.educations} />
        <SkillsSection documentId={document.id} skills={document.skills} />
        <ProjectSection documentId={document.id} projects={document.projects} />
      </div>
    </div>
  );
}
