import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentVersionEditor } from "@/components/documents/document-version-editor";
import { AddVersionForm } from "@/components/documents/add-version-form";
import { ListChecks } from "lucide-react";
import { getBaseDocuments } from "@/lib/data/documents";
import { documentKindLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export default async function DocumentsPage() {
  const baseDocuments = await getBaseDocuments();

  return (
    <div>
      <PageHeader
        title="Base Documents"
        description="Your CV and cover letter versions. Every tailored copy starts from one of these."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(["CV", "COVER_LETTER"] as const).map((kind) => {
          const kindLabel = documentKindLabels[kind];
          const docs = baseDocuments.filter((d) => d.kind === kind);

          return (
            <Card key={kind}>
              <CardHeader>
                <CardTitle className="text-base">
                  {kindLabel} versions{docs.length > 0 ? ` (${docs.length})` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {docs.length > 0 && (
                  // Keyed by the current lead item so a newly added/edited version's expanded
                  // default is re-applied on a fresh mount, instead of an uncontrolled Accordion
                  // silently ignoring a changed defaultValue on an already-mounted instance.
                  <Accordion key={docs[0].id} defaultValue={[docs[0].id]}>
                    {docs.map((doc) => (
                      <AccordionItem key={doc.id} value={doc.id}>
                        <AccordionTrigger>
                          <span className="flex flex-col items-start text-left">
                            <span className="flex items-center gap-1.5">
                              {doc.name || `Untitled ${kindLabel}`}
                              {doc.isStructured && (
                                <Badge variant="outline" className="gap-1">
                                  <ListChecks className="h-3 w-3" />
                                  Built from sections
                                </Badge>
                              )}
                            </span>
                            <span className="text-xs font-normal text-muted-foreground">
                              Updated {formatDate(doc.updatedAt)}
                            </span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          {doc.isStructured ? (
                            <LinkButton href={`/documents/${doc.id}/builder`} variant="outline" size="sm">
                              <ListChecks className="h-4 w-4" />
                              Open CV builder
                            </LinkButton>
                          ) : (
                            <DocumentVersionEditor document={doc} kindLabel={kindLabel} />
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}

                <AddVersionForm kind={kind} kindLabel={kindLabel} startOpen={docs.length === 0} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
