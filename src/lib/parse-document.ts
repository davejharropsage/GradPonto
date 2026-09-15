const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function parseDocumentFile(file: File): Promise<{ text: string; filename: string }> {
  if (file.size === 0) throw new Error("That file is empty");
  if (file.size > MAX_SIZE_BYTES) throw new Error("File is too large — 10MB max");

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  let text: string;

  if (name.endsWith(".pdf")) {
    // Import the inner lib file directly, not the package root — pdf-parse's
    // index.js has a `!module.parent` debug-mode check that misfires under
    // bundlers (it tries to read a test fixture that doesn't exist here).
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const data = await pdfParse(buffer);
    text = data.text;
  } else if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (name.endsWith(".txt") || name.endsWith(".md")) {
    text = buffer.toString("utf-8");
  } else if (name.endsWith(".doc")) {
    throw new Error("Legacy .doc files aren't supported — please save it as .docx or .pdf and try again");
  } else {
    throw new Error("Unsupported file type — upload a PDF, DOCX, or TXT file");
  }

  text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (!text) {
    throw new Error("Couldn't find any text in that file — it may be a scanned image without a text layer");
  }

  return { text, filename: file.name };
}
