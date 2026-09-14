import { getClient, extractJson } from "./client";

export interface JobAnalysis {
  title: string;
  company: string;
  location: string;
  salary: string;
  deadline: string; // ISO date, or "" if not found
  summary: string;
  keySkills: string[];
}

export async function analyzeJobDescription(jobText: string): Promise<JobAnalysis> {
  const client = getClient();

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: [
          "Extract structured details from this job/placement posting. Respond with ONLY a JSON object (no markdown fence, no commentary) matching exactly this shape:",
          `{"title": string, "company": string, "location": string, "salary": string, "deadline": string, "summary": string, "keySkills": string[]}`,
          "",
          "Rules:",
          '- "deadline" must be an ISO date (YYYY-MM-DD) if a closing/application date is mentioned, otherwise an empty string.',
          '- "salary" is the pay/stipend as written (e.g. "£24,000" or "£350/week"), or an empty string if not mentioned.',
          '- "summary" is a 2-3 sentence plain-English summary of the role.',
          '- "keySkills" is 3-8 short skill/requirement keywords.',
          "- Use an empty string for any text field you cannot find. Never invent information.",
          "",
          "Job posting:",
          jobText,
        ].join("\n"),
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  const raw = textBlock?.type === "text" ? textBlock.text : "{}";
  return extractJson<JobAnalysis>(raw);
}
