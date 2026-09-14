"use server";

import { analyzeJobDescription, type JobAnalysis } from "@/lib/ai/analyze-job";
import { matchCvToJob, type CvMatch } from "@/lib/ai/match-cv";
import { db } from "@/lib/db";

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
  const parsed = new URL(url); // throws on an invalid URL, caught by the caller
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) URLs are supported");
  }

  const res = await fetch(parsed.toString(), {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PlacementPilot/1.0)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Could not fetch that URL (HTTP ${res.status})`);

  const html = await res.text();
  const text = stripHtml(html);
  // Job pages are often mostly nav/footer noise — cap what we send to Claude.
  return { text: text.slice(0, 12000) };
}

export async function analyzeJob(jobText: string): Promise<JobAnalysis> {
  if (!jobText.trim()) throw new Error("Paste a job description first");
  return analyzeJobDescription(jobText);
}

export async function matchCv(params: { cvContent: string; applicationId: string }): Promise<CvMatch> {
  const application = await db.application.findUniqueOrThrow({ where: { id: params.applicationId } });
  if (!application.description) {
    throw new Error("This application has no job description saved to match against");
  }
  return matchCvToJob(params.cvContent, application.description);
}
