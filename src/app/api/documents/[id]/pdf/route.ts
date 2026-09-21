import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/auth/user";
import { renderDocumentToPdf } from "@/lib/pdf/render";
import { documentKindLabels } from "@/lib/labels";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const document = await ctx.db.document.findUnique({
    where: { id },
    include: { application: { include: { employer: true } } },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const title = document.application
    ? `${documentKindLabels[document.kind]}: ${document.application.title}`
    : documentKindLabels[document.kind];

  const pdfBuffer = await renderDocumentToPdf(title, document.content);

  const filenamePart = document.application?.title ?? documentKindLabels[document.kind];
  const filename = `${filenamePart.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${document.kind.toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
