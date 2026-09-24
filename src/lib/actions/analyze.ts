"use server";

import { unstable_rethrow } from "next/navigation";
import { analyzeJobDescription, type JobAnalysis } from "@/lib/ai/analyze-job";
import { matchCvToJob, type CvMatch } from "@/lib/ai/match-cv";
import { reviewCvGenerally, extractAtsKeywords, type CvHealthCheck } from "@/lib/ai/review-cv";
import { requireAiAllowance } from "@/lib/ai/limit";
import { requireRegisteredUser, userDb } from "@/lib/auth/user";
import { fetchPublicPage } from "@/lib/net/safe-fetch";

/**
 * Next.js redacts a thrown Error's message in production before it reaches the client — great for
 * accidental leaks, but it also silently ate every deliberate "here's what you did wrong" message
 * below (e.g. "Paste a job description first"), replacing them with an opaque digest the browser
 * can't show. Every export in this file returns one of these instead of throwing for an expected,
 * user-facing case, so the real message survives the trip. unstable_rethrow lets Next's own
 * control-flow throws (redirect(), notFound()) pass through untouched — those must never be caught
 * here, only genuine errors.
 */
type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function tryAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

// Keyword extraction only depends on the job description, so it's cached per application the same
// way Adzuna search results are cached (lib/jobs/search.ts) — re-checking a different CV against
// the same job never costs a second AI call. Lives in this module's memory; see that file's note
// on moving to a shared store (e.g. Redis) if you ever run more than one server instance.
const ATS_KEYWORDS_CACHE_TTL_MS = 15 * 60 * 1000;
const ATS_KEYWORDS_CACHE_MAX_ENTRIES = 200;
const atsKeywordsCache = new Map<string, { at: number; keywords: string[] }>();

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

export async function fetchJobFromUrl(url: string): Promise<ActionResult<{ text: string }>> {
  return tryAction(async () => {
    await requireRegisteredUser();
    const html = await fetchPublicPage(url, { userAgent: "Mozilla/5.0 (compatible; GradPonto/1.0)" });
    const text = stripHtml(html);
    // Job pages are often mostly nav/footer noise, so cap what we send to the AI.
    return { text: text.slice(0, 12000) };
  });
}

export async function analyzeJob(jobText: string): Promise<ActionResult<JobAnalysis>> {
  return tryAction(async () => {
    await requireAiAllowance();
    if (!jobText.trim()) throw new Error("Paste a job description first");
    return analyzeJobDescription(jobText);
  });
}

export async function matchCv(params: { cvContent: string; applicationId: string }): Promise<ActionResult<CvMatch>> {
  return tryAction(async () => {
    await requireAiAllowance();
    const db = await userDb();
    const application = await db.application.findUniqueOrThrow({ where: { id: params.applicationId } });
    if (!application.description) {
      throw new Error("This application has no job description saved to match against");
    }
    return matchCvToJob(params.cvContent, application.description);
  });
}

export async function reviewCvHealth(cvContent: string): Promise<ActionResult<CvHealthCheck>> {
  return tryAction(async () => {
    await requireAiAllowance();
    if (!cvContent.trim()) throw new Error("Add a CV first");
    return reviewCvGenerally(cvContent);
  });
}

export async function getAtsKeywords(applicationId: string): Promise<ActionResult<string[]>> {
  return tryAction(async () => {
    // Ownership is checked first, every time — even a cache hit only ever returns keywords for an
    // application this user's own scoped query can see.
    const db = await userDb();
    const application = await db.application.findUniqueOrThrow({ where: { id: applicationId } });

    const cached = atsKeywordsCache.get(applicationId);
    if (cached && Date.now() - cached.at < ATS_KEYWORDS_CACHE_TTL_MS) return cached.keywords;

    await requireAiAllowance();
    if (!application.description) {
      throw new Error("This application has no job description saved to extract keywords from");
    }

    const keywords = await extractAtsKeywords(application.description);
    atsKeywordsCache.set(applicationId, { at: Date.now(), keywords });
    if (atsKeywordsCache.size > ATS_KEYWORDS_CACHE_MAX_ENTRIES) {
      atsKeywordsCache.delete(atsKeywordsCache.keys().next().value as string);
    }
    return keywords;
  });
}
