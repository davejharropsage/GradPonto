// Pure logic for job search results: cleaning, de-duplicating, scoring and ranking.
//
// Ported from the Python search harness (plavementpro/placementapp/matcher.py + dedupe.py):
//   - a keyword hit in the TITLE is worth 3 points, in the description snippet 1 point
//   - each keyword counts once per field; results that match no keyword are dropped
//   - duplicates (same employer + title + location) collapse to one
// plus two small additions for students, described below.
//
// No imports and no server code, so it can be unit-tested directly with `node --test`.
// Keep to plain TypeScript syntax Node can run (no enums, no path aliases).

export interface JobListing {
  id: string;
  title: string;
  employer: string;
  location: string;
  url: string;
  postedDate: string | null;
  snippet: string;
  salary: string | null;
  score: number;
  matchedKeywords: string[];
  /** Looks like a real student opportunity (internship, apprenticeship, placement year...). */
  studentFriendly: boolean;
  /** Looks like a staff/senior role rather than an opportunity for a student. */
  staffRole: boolean;
  /** Looks like a training course that charges the candidate a fee. Hidden by default. */
  paidCourse: boolean;
}

export const TITLE_MATCH_WEIGHT = 3;
export const SNIPPET_MATCH_WEIGHT = 1;
export const STUDENT_BOOST = 2;
export const STAFF_PENALTY = 3;
export const MAX_KEYWORDS = 5;
export const MAX_KEYWORD_LENGTH = 40;

/** Strips HTML tags (Adzuna wraps matched words in <strong>) and decodes common entities. */
export function cleanText(input: string | null | undefined): string {
  return (input ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Shortens to about `max` characters, cutting at a word boundary. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/** "data analytics, business studies" -> ["data analytics", "business studies"]. */
export function parseKeywords(raw: string): string[] {
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const part of raw.split(/[,\n;]/)) {
    const keyword = part.replace(/\s+/g, " ").trim().slice(0, MAX_KEYWORD_LENGTH);
    const key = keyword.toLowerCase();
    if (keyword && !seen.has(key)) {
      seen.add(key);
      keywords.push(keyword);
    }
    if (keywords.length >= MAX_KEYWORDS) break;
  }
  return keywords;
}

function normalise(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function dedupeKey(listing: Pick<JobListing, "employer" | "title" | "location">): string {
  return [normalise(listing.employer), normalise(listing.title), normalise(listing.location)].join("|");
}

function containsKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

/** Points for keyword hits: title hits count more than description hits. Also returns which matched. */
export function keywordScore(listing: Pick<JobListing, "title" | "snippet">, keywords: string[]) {
  let score = 0;
  const matched: string[] = [];
  for (const keyword of keywords) {
    let hit = false;
    if (containsKeyword(listing.title, keyword)) {
      score += TITLE_MATCH_WEIGHT;
      hit = true;
    }
    if (containsKeyword(listing.snippet, keyword)) {
      score += SNIPPET_MATCH_WEIGHT;
      hit = true;
    }
    if (hit) matched.push(keyword);
  }
  return { score, matched };
}

// --- Additions for students -------------------------------------------------------------------
// A plain keyword search for "placement" mostly returns people who ARRANGE placements (a "Placement
// Officer"), and long lists of senior roles. These small, transparent rules nudge the ranking towards
// roles a student could actually apply for. They only ever re-order results: nothing is removed
// because of them (except fee-charging courses, which are hidden behind a visible toggle).

const EXPLICIT_STUDENT = /\b(intern|internship|apprentice|apprenticeship|trainee|student|graduate|sandwich)\b/i;
const PLACEMENT_WORD = /\b(placements?|year in industry)\b/i;
const STAFF_ROLE = /\b(officer|adviser|advisor|coordinator|co-ordinator|manager|director|head of|lecturer|tutor|assessor|recruiter|teacher|senior|principal|lead)\b/i;

// Training courses dressed up as jobs: "self-funded programme, fees apply, job guarantee".
const PAID_COURSE = /\b(fees? apply|self[- ]funded|job guarantee|guaranteed job|course fees?|training fees?|tuition fees?|enrol(?:l)?ment fee|pay (?:for|a fee)|paid training course)\b/i;

export function classify(title: string, snippet: string) {
  const explicit = EXPLICIT_STUDENT.test(title);
  const staff = STAFF_ROLE.test(title);
  return {
    studentFriendly: explicit || (PLACEMENT_WORD.test(title) && !staff),
    staffRole: staff && !explicit,
    paidCourse: PAID_COURSE.test(`${title} ${snippet}`),
  };
}

/**
 * Scores, filters and orders raw listings for the given keywords.
 * `score` is the keyword score plus the small student adjustments; a listing must match at
 * least one keyword to be kept (same rule as the Python harness).
 */
export function rankListings(
  raw: Array<Omit<JobListing, "score" | "matchedKeywords" | "studentFriendly" | "staffRole" | "paidCourse">>,
  keywords: string[]
): JobListing[] {
  const seen = new Set<string>();
  const ranked: JobListing[] = [];

  for (const item of raw) {
    const key = dedupeKey(item);
    if (seen.has(key)) continue;
    seen.add(key);

    const { score: base, matched } = keywordScore(item, keywords);
    if (base <= 0) continue;

    const flags = classify(item.title, item.snippet);
    const score = base + (flags.studentFriendly ? STUDENT_BOOST : 0) - (flags.staffRole ? STAFF_PENALTY : 0);
    ranked.push({ ...item, score, matchedKeywords: matched, ...flags });
  }

  return ranked.sort(
    (a, b) =>
      b.score - a.score ||
      b.matchedKeywords.length - a.matchedKeywords.length ||
      (b.postedDate ?? "").localeCompare(a.postedDate ?? "")
  );
}

/** "£28,102 – £30,012", "£30,000", or null. */
export function formatSalary(min: number | null | undefined, max: number | null | undefined): string | null {
  const fmt = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");
  const lo = typeof min === "number" && min > 0 ? min : null;
  const hi = typeof max === "number" && max > 0 ? max : null;
  if (lo && hi && Math.round(lo) !== Math.round(hi)) return `${fmt(lo)} – ${fmt(hi)}`;
  const single = hi ?? lo;
  return single ? fmt(single) : null;
}
