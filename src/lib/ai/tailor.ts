import { generateText } from "./client";
import { coverLetterTemplates } from "@/lib/labels";

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
  /** Only meaningful for COVER_LETTER — a key from lib/labels.ts's coverLetterTemplates. */
  templateKey?: string | null;
  /** Only meaningful for COVER_LETTER — the candidate's CV, so the letter can reference real,
   * specific experience relevant to this job instead of just restyling the base letter's own
   * generic text for a new employer name. Optional: without one, tailoring falls back to the
   * base letter alone, same as before this existed. */
  cvContent?: string | null;
}) {
  const template =
    params.kind === "COVER_LETTER" && params.templateKey
      ? coverLetterTemplates.find((t) => t.key === params.templateKey)
      : undefined;
  const cv = params.kind === "COVER_LETTER" ? params.cvContent?.trim() : undefined;

  return generateText(
    [
      `You are helping a student tailor their ${params.kind === "CV" ? "CV" : "cover letter"} for a specific job application.`,
      KIND_INSTRUCTIONS[params.kind],
      cv
        ? "Ground the letter in the candidate's actual CV below: pick out 1-2 specific roles, skills, projects or achievements from it that are genuinely relevant to this job's requirements, and reference them concretely. Do not invent experience, skills or qualifications that aren't in the CV."
        : "",
      template ? `Tone: ${template.instruction}` : "",
      "",
      `Job title: ${params.jobTitle}`,
      params.employerName ? `Employer: ${params.employerName}` : "",
      params.jobDescription ? `Job description:\n${params.jobDescription}` : "",
      cv ? `Candidate's CV:\n${cv}` : "",
      "",
      `Base ${params.kind === "CV" ? "CV" : "cover letter"}${cv ? " (for tone and structure — the CV above is the source of truth for what the candidate has actually done)" : ""}:\n${params.baseContent}`,
      "",
      "Return only the tailored document text, no commentary.",
    ]
      .filter(Boolean)
      .join("\n"),
    { maxTokens: 2000 }
  );
}
