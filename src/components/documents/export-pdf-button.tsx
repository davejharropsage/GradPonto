import { Download } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";

export function ExportPdfButton({ documentId }: { documentId: string }) {
  return (
    <LinkButton href={`/api/documents/${documentId}/pdf`} variant="outline">
      <Download className="h-4 w-4" />
      Export PDF
    </LinkButton>
  );
}
