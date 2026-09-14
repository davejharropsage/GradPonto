import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentContentEditor } from "@/components/documents/document-content-editor";
import { ExportPdfButton } from "@/components/documents/export-pdf-button";
import { DeleteButton } from "@/components/shared/delete-button";
import { getDocument } from "@/lib/data/documents";
import { deleteDocument } from "@/lib/actions/documents";
import { documentKindLabels } from "@/lib/labels";

export default async function ApplicationDocumentPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = await params;
  const document = await getDocument(docId);
  if (!document || document.applicationId !== id) notFound();

  return (
    <div>
      <Link href={`/applications/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Back to application
      </Link>

      <PageHeader
        title={documentKindLabels[document.kind]}
        actions={
          <>
            {document.generatedByAI && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                AI drafted — review before use
              </Badge>
            )}
            <ExportPdfButton documentId={document.id} />
            <DeleteButton
              action={deleteDocument.bind(null, document.id)}
              label="Delete Document"
              redirectTo={`/applications/${id}`}
            />
          </>
        }
      />

      <DocumentContentEditor documentId={document.id} initialContent={document.content} />
    </div>
  );
}
