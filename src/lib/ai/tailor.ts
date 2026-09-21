import { generateText } from "./client";

const KIND_INSTRUCTIONS: Record<string, string> = {
  CV: "Adjust emphasis, ordering, and wording of the CV to highlight the experience most relevant to this job. Do not invent experience that isn't in the base CV. Keep the same overall structure and length.",
  COVER_LETTER: "Write a tailored cover letter for this specific job, based on the base cover letter's tone and the candidate's background. Reference the employer and role naturally. Keep it concise (under 400 words).",
};

export async function tailorDocument(params: {
  kind: "CV" | "COVER_LETTER";
  baseContent: string;
  jobTitle: string;
  employerName?: string | null;
  jobDescription?: string | null;
}) {
  return generateText(
    [
      `You are helping a student tailor their ${params.kind === "CV" ? "CV" : "cover letter"} for a specific job application.`,
      KIND_INSTRUCTIONS[params.kind],
      "",
      `Job title: ${params.jobTitle}`,
      params.employerName ? `Employer: ${params.employerName}` : "",
      params.jobDescription ? `Job description:\n${params.jobDescription}` : "",
      "",
      `Base ${params.kind === "CV" ? "CV" : "cover letter"}:\n${params.baseContent}`,
      "",
      "Return only the tailored document text, no commentary.",
    ]
      .filter(Boolean)
      .join("\n"),
    { maxTokens: 2000 }
  );
}
