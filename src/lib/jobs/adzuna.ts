import "server-only";
import { z } from "zod";
import { cleanText, formatSalary, truncate, type JobListing } from "./listing";

// Client for the Adzuna Jobs API (https://developer.adzuna.com), UK endpoint.
// Ported from the Python harness (plavementpro/placementapp/adapters/adzuna.py).
//
// The API key travels in the query string (Adzuna's design), so this URL must never be logged,
// returned to the browser or included in an error message. Everything here runs on the server.

const DEFAULT_ENDPOINT = "https://api.adzuna.com/v1/api/jobs/gb/search/1";
const RESULTS_PER_PAGE = 50;
const TIMEOUT_MS = 10_000;

export type RawListing = Omit<JobListing, "score" | "matchedKeywords" | "studentFriendly" | "staffRole" | "paidCourse">;

export class AdzunaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdzunaError";
  }
}

export function adzunaConfigured(): boolean {
  return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}

const resultSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  redirect_url: z.string().optional(),
  created: z.string().optional(),
  company: z.object({ display_name: z.string().optional() }).nullish(),
  location: z.object({ display_name: z.string().optional() }).nullish(),
  salary_min: z.number().nullish(),
  salary_max: z.number().nullish(),
  salary_is_predicted: z.union([z.string(), z.number(), z.boolean()]).nullish(),
});
const responseSchema = z.object({ results: z.array(resultSchema).default([]) });

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Maps Adzuna's response into our listing shape, skipping anything unusable. Exported for tests. */
export function mapResults(payload: unknown): RawListing[] {
  const parsed = responseSchema.safeParse(payload);
  if (!parsed.success) throw new AdzunaError("Unexpected response from the job search service.");

  const listings: RawListing[] = [];
  for (const item of parsed.data.results) {
    const title = cleanText(item.title);
    const url = item.redirect_url ?? "";
    if (!title || !isHttpUrl(url)) continue;

    // Adzuna's own salary *estimates* (salary_is_predicted) must carry a separate "Jobsworth"
    // credit under their terms, so only real, advertised salaries are shown.
    const predicted = String(item.salary_is_predicted ?? "0");
    const advertised = predicted === "0" || predicted === "false";

    listings.push({
      id: String(item.id ?? url),
      title: truncate(title, 200),
      employer: truncate(cleanText(item.company?.display_name) || "Unknown employer", 120),
      location: truncate(cleanText(item.location?.display_name), 120),
      url,
      postedDate: item.created ?? null,
      snippet: truncate(cleanText(item.description), 320),
      salary: advertised ? formatSalary(item.salary_min, item.salary_max) : null,
    });
  }
  return listings;
}

/**
 * One request per search. All the user's words go into `what_or` (match any), so a single call
 * covers every keyword and we save the shared quota; ranking then happens locally.
 */
export async function fetchAdzuna(keywords: string[], location: string): Promise<RawListing[]> {
  const words = [...new Set(keywords.flatMap((k) => k.toLowerCase().split(/\s+/)).filter((w) => w.length > 1))].slice(0, 12);

  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID ?? "",
    app_key: process.env.ADZUNA_APP_KEY ?? "",
    results_per_page: String(RESULTS_PER_PAGE),
    what_or: words.join(" "),
    max_days_old: "60",
    "content-type": "application/json",
  });
  if (location) params.set("where", location);

  let response: Response;
  try {
    response = await fetch(`${process.env.ADZUNA_API_BASE || DEFAULT_ENDPOINT}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    // Deliberately not including the error: some runtimes echo the full URL (with the key) in it.
    throw new AdzunaError("The job search service didn't respond.");
  }

  if (response.status === 401 || response.status === 403) throw new AdzunaError("The job search service rejected our credentials.");
  if (response.status === 429) throw new AdzunaError("The job search service is rate limiting us.");
  if (!response.ok) throw new AdzunaError(`The job search service returned an error (HTTP ${response.status}).`);

  return mapResults(await response.json());
}
