// Pure logic for ATS keyword coverage: does a CV's text literally contain each keyword an
// applicant-tracking system would likely scan a job posting for? This is deliberately separate
// from the AI judgement in lib/ai/match-cv.ts — a plain, explainable word match, not a model's
// opinion, and it costs nothing to re-run every time the CV selection changes (see
// getAtsKeywords in lib/actions/analyze.ts for the one AI call, which only ever extracts the
// keyword list itself from the job description).
//
// No imports and no server code, so it can be unit-tested directly with `node --test`. The same
// word-boundary approach as lib/jobs/listing.ts's keyword matching, kept separate rather than
// imported so the CV-review domain doesn't depend on the job-search domain.

export interface KeywordMatch {
  keyword: string;
  found: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whole-word, case-insensitive containment — "SQL" matches "SQL skills" but not "MySQL". Uses
 * lookaround rather than \b: many real keywords end or start in punctuation ("C++", "C#",
 * "Node.js"), where \b's word/non-word transition rule doesn't land where you'd expect (\b right
 * after "++" fails to match before a space, since neither side is a word character).
 */
function containsKeyword(text: string, keyword: string): boolean {
  const escaped = escapeRegExp(keyword.trim());
  if (!escaped) return false;
  return new RegExp(`(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, "i").test(text);
}

/** Checks each keyword against the CV text, keeping the order the keyword list was given in. */
export function matchKeywordsToCv(keywords: string[], cvText: string): KeywordMatch[] {
  return keywords.map((keyword) => ({ keyword, found: containsKeyword(cvText, keyword) }));
}

/** 0-100, rounded — the share of keywords found in the CV. */
export function coveragePercent(matches: KeywordMatch[]): number {
  if (matches.length === 0) return 0;
  const found = matches.filter((m) => m.found).length;
  return Math.round((found / matches.length) * 100);
}
