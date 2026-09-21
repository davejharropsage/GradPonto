"use server";

import { analyzeJobDescription, type JobAnalysis } from "@/lib/ai/analyze-job";
import { matchCvToJob, type CvMatch } from "@/lib/ai/match-cv";
import { requireAiAllowance } from "@/lib/ai/limit";
import { requireRegisteredUser, userDb } from "@/lib/auth/user";
import { fetchPublicPage } from "@/lib/net/safe-fetch";

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchJobFromUrl(url: string): Promise<{ text: string }> {
  await requireRegisteredUser();

  const html = await fetchPublicPage(url, { userAgent: "Mozilla/5.0 (compatible; GradPonto/1.0)" });
  const text = stripHtml(html);
  // Job pages are often mostly nav/footer noise, so cap what we send to the AI.
  return { text: text.slice(0, 12000) };
}

export async function analyzeJob(jobText: string): Promise<JobAnalysis> {
  await requireAiAllowance();
  if (!jobText.trim()) throw new Error("Paste a job description first");
  return analyzeJobDescription(jobText);
}

export async function matchCv(params: { cvContent: string; applicationId: string }): Promise<CvMatch> {
  await requireAiAllowance();
  const db = await userDb();
  const application = await db.application.findUniqueOrThrow({ where: { id: params.applicationId } });
  if (!application.description) {
    throw new Error("This application has no job description saved to match against");
  }
  return matchCvToJob(params.cvContent, application.description);
}
