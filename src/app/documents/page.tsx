import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentContentEditor } from "@/components/documents/document-content-editor";
import { getBaseDocuments } from "@/lib/data/documents";
import { createBaseDocument } from "@/lib/actions/documents";
import { documentKindLabels } from "@/lib/labels";

export default async function DocumentsPage() {
  const baseDocuments = await getBaseDocuments();
  const baseCv = baseDocuments.find((d) => d.kind === "CV");
  const baseCoverLetter = baseDocuments.find((d) => d.kind === "COVER_LETTER");

  return (
    <div>
      <PageHeader
        title="Base Documents"
        description="Your master CV and cover letter — every tailored version starts from these."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(["CV", "COVER_LETTER"] as const).map((kind) => {
          const doc = kind === "CV" ? baseCv : baseCoverLetter;
          return (
            <Card key={kind}>
              <CardHeader>
                <CardTitle className="text-base">Base {documentKindLabels[kind]}</CardTitle>
              </CardHeader>
              <CardContent>
                {doc ? (
                  <DocumentContentEditor documentId={doc.id} initialContent={doc.content} />
                ) : (
                  <form action={createBaseDocument.bind(null, kind)} className="grid gap-3">
                    <Textarea
                      name="content"
                      rows={12}
                      placeholder={`Paste your base ${documentKindLabels[kind].toLowerCase()} here...`}
                    />
                    <div>
                      <Button type="submit">Save Base {documentKindLabels[kind]}</Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
