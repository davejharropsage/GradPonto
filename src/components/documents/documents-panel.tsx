import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AddDocumentButton } from "./add-document-button";
import { documentKindLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { Document } from "@/generated/prisma/client";

export function DocumentsPanel({
  applicationId,
  documents,
  baseDocuments,
  aiAvailable,
}: {
  applicationId: string;
  documents: Document[];
  baseDocuments: Document[];
  aiAvailable: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Documents</CardTitle>
        <AddDocumentButton applicationId={applicationId} baseDocuments={baseDocuments} aiAvailable={aiAvailable} />
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No tailored documents yet"
            description="Add a CV or cover letter tailored to this application."
          />
        ) : (
          <ul className="divide-y">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/applications/${applicationId}/documents/${doc.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {documentKindLabels[doc.kind]}
                  </Link>
                  <p className="text-xs text-muted-foreground">Updated {formatDate(doc.updatedAt)}</p>
                </div>
                {doc.generatedByAI && (
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI drafted
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
