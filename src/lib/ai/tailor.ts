import Anthropic from "@anthropic-ai/sdk";

export class TailorNotConfiguredError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set — AI tailoring is unavailable. Add it to .env to enable this feature.");
    this.name = "TailorNotConfiguredError";
  }
}

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new TailorNotConfiguredError();
  return new Anthropic({ apiKey });
}

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
  const client = getClient();

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
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
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}
