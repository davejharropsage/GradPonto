import { generateText, extractJson } from "./client";

export interface CvMatch {
  score: number; // 0-100
  strengths: string[];
  gaps: string[];
  suggestions: string[];
}

export async function matchCvToJob(cvContent: string, jobDescription: string): Promise<CvMatch> {
  const raw = await generateText(
    [
      "Compare this CV against this job description and assess fit. Respond with ONLY a JSON object (no markdown fence, no commentary) matching exactly this shape:",
      `{"score": number, "strengths": string[], "gaps": string[], "suggestions": string[]}`,
      "",
      "Rules:",
      '- "score" is 0-100, how well the CV matches the job requirements.',
      '- "strengths" is 2-5 short bullet points on what already matches well.',
      '- "gaps" is 2-5 short bullet points on missing or weak areas relative to the job.',
      '- "suggestions" is 2-5 short, concrete, actionable edits to improve the match (e.g. specific skills or phrasing to add).',
      "- Be honest and specific — don't just praise the CV.",
      "",
      `Job description:\n${jobDescription}`,
      "",
      `CV:\n${cvContent}`,
    ].join("\n"),
    { json: true, maxTokens: 1200 }
  );
  return extractJson<CvMatch>(raw);
}
