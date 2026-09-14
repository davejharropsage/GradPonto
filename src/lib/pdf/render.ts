import { Document as PdfDocument, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, lineHeight: 1.5, fontFamily: "Helvetica" },
  title: { fontSize: 14, marginBottom: 16, fontFamily: "Helvetica-Bold" },
  paragraph: { marginBottom: 8 },
});

export async function renderDocumentToPdf(title: string, content: string) {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const element = createElement(
    PdfDocument,
    null,
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(Text, { style: styles.title }, title),
      createElement(
        View,
        null,
        paragraphs.map((paragraph, i) =>
          createElement(Text, { key: i, style: styles.paragraph }, paragraph)
        )
      )
    )
  );

  return renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
}
