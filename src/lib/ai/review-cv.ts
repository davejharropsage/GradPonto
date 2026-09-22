import { generateText, extractJson } from "./client";

export interface CvHealthCheck {
  score: number; // 0-100
  strengths: string[];
  issues: string[];
  suggestions: string[];
}

// Unlike matchCvToJob (lib/ai/match-cv.ts), this has no job to compare against — it judges the CV
// on its own terms: structure, clarity, length, and common CV mistakes, not fit for a specific role.
export async function reviewCvGenerally(cvContent: string): Promise<CvHealthCheck> {
  const raw = await generateText(
    [
      "Give a general health check on this CV, with no specific job in mind. Respond with ONLY a JSON object (no markdown fence, no commentary) matching exactly this shape:",
      `{"score": number, "strengths": string[], "issues": string[], "suggestions": string[]}`,
      "",
      "Rules:",
      '- "score" is 0-100, an overall assessment of how strong the CV is as a general document (structure, clarity, impact), not a match to any job.',
      '- "strengths" is 2-5 short bullet points on what already works well.',
      '- "issues" is 2-5 short bullet points on structural or clarity problems: things like unclear formatting, missing sections, too long or too short, vague or passive language, no quantified achievements.',
      '- "suggestions" is 2-5 short, concrete, actionable edits to fix the issues above.',
      "- Be honest and specific — don't just praise the CV. Focus on the document itself, not how well it suits any particular role.",
      "",
      `CV:\n${cvContent}`,
    ].join("\n"),
    { json: true, maxTokens: 1000 }
  );
  return extractJson<CvHealthCheck>(raw);
}
