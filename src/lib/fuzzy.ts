// Strips common company suffixes/punctuation so "Acme Ltd" and "Acme
// Robotics, Inc." both reduce to a comparable core name before matching.
const SUFFIXES = /\b(ltd|limited|inc|incorporated|llc|llp|plc|corp|corporation|co|company|group)\b\.?/gi;

export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(SUFFIXES, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

// 1 = identical, 0 = completely different, based on edit distance relative
// to the longer string's length.
export function similarity(a: string, b: string): number {
  const longer = Math.max(a.length, b.length);
  if (longer === 0) return 1;
  return 1 - levenshtein(a, b) / longer;
}

const DUPLICATE_THRESHOLD = 0.82;

// True if two company names are close enough to plausibly be the same
// employer (exact match after normalization, one contains the other, or a
// high fuzzy-similarity score — catches typos like "Robotics" vs "Robtics").
export function looksLikeDuplicate(a: string, b: string): boolean {
  const na = normalizeCompanyName(a);
  const nb = normalizeCompanyName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length > 3 && nb.length > 3 && (na.includes(nb) || nb.includes(na))) return true;
  return similarity(na, nb) >= DUPLICATE_THRESHOLD;
}
