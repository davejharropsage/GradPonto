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

// Feeds the ATS Keywords tab. Only extracts the keyword list — the actual CV-vs-keyword matching
// is a plain word match (lib/cv/ats.ts), not an AI judgement, so it costs nothing to re-run.
export async function extractAtsKeywords(jobDescription: string): Promise<string[]> {
  const raw = await generateText(
    [
      "Extract the specific skills, tools, technologies and requirements an applicant-tracking system would scan a CV for, based on this job posting. Respond with ONLY a JSON object (no markdown fence, no commentary) matching exactly this shape:",
      `{"keywords": string[]}`,
      "",
      "Rules:",
      '- List 8-15 short, specific terms exactly as they would appear written on a CV: named skills, tools, technologies, qualifications, or explicit requirements (e.g. "SQL", "Python", "driving licence", "2:1 degree") — not vague soft-skill phrases like "team player" unless the posting names it as a specific requirement.',
      '- Keep each term short (1-4 words) and literal, so it can be matched word-for-word against a CV.',
      '- Don\'t list near-duplicates (e.g. just "SQL", not both "SQL" and "SQL databases").',
      "",
      `Job posting:\n${jobDescription}`,
    ].join("\n"),
    { json: true, maxTokens: 600 }
  );
  return extractJson<{ keywords: string[] }>(raw).keywords;
}
