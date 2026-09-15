"use server";

import { parseDocumentFile } from "@/lib/parse-document";

export async function extractCvText(formData: FormData): Promise<{ text: string; filename: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file received");
  return parseDocumentFile(file);
}
