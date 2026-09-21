"use server";

import { parseDocumentFile } from "@/lib/parse-document";
import { requireRegisteredUser } from "@/lib/auth/user";

export async function extractCvText(formData: FormData): Promise<{ text: string; filename: string }> {
  await requireRegisteredUser();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file received");
  return parseDocumentFile(file);
}
