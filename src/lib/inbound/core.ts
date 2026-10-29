import { createHash, randomBytes } from "node:crypto";
import { looksLikeDuplicate, normalizeCompanyName, similarity } from "../fuzzy.ts";
import { applicationStatuses } from "../labels.ts";

// The pure half of email import: no network, no database, no env, so tests/email-import.test.ts
// can import it through the plain node:test runner. Parsing what the inbound provider sends lives
// in ./parse.ts, storing and processing it (every database write) in ./ingest.ts and ./process.ts.

export type ApplicationStatus = (typeof applicationStatuses)[number];

// --- Senders and the Gmail filter ---------------------------------------------------------------

// Applicant-tracking systems and assessment platforms that send application updates. Matched as
// the sender's domain or any parent of it (so "fa.em2.oraclecloud.com" matches "oraclecloud.com").
export const ATS_SENDER_DOMAINS = [
  "myworkday.com",
  "myworkdayjobs.com",
  "workday.com",
  "greenhouse.io",
  "greenhouse-mail.io",
  "lever.co",
  "smartrecruiters.com",
  "taleo.net",
  "oraclecloud.com",
  "successfactors.com",
  "successfactors.eu",
  "icims.com",
  "jobvite.com",
  "ashbyhq.com",
  "workablemail.com",
  "teamtailor.com",
  "tal.net",
  "oleeo.com",
  "beapplied.com",
  "pinpointhq.com",
  "hirevue.com",
  "cappfinity.com",
  "sovaassessment.com",
  "eightfold.ai",
  "avature.net",
] as const;

// Job boards whose mail is alerts and marketing rather than updates on something you applied to.
export const NEWSLETTER_SENDER_DOMAINS = [
  "brightnetwork.co.uk",
  "gradcracker.com",
  "prospects.ac.uk",
  "targetjobs.co.uk",
  "milkround.com",
  "ratemyplacement.co.uk",
  "higherin.com",
  "glassdoor.com",
  "glassdoor.co.uk",
  "handshake.com",
  "joinhandshake.com",
] as const;

const FILTER_PHRASES = [
  '"application received"',
  '"thank you for applying"',
  '"thanks for applying"',
  '"thank you for your application"',
  '"your application"',
  "interview",
  "assessment",
  '"online test"',
  "hirevue",
  "offer",
  "unfortunately",
  "regret",
];

/**
 * What users paste into a Gmail filter's "Has the words" box to forward likely application emails
 * (and nothing else) to their GradPonto address. `{a b}` is Gmail's OR. Wide on purpose — the
 * pre-filter and the AI do the narrowing; a missed rejection is worse than a wasted classification.
 * The same text works as a Gmail search, for picking old emails to forward as attachments.
 */
export function gmailFilterQuery(): string {
  const terms = [...FILTER_PHRASES, ...ATS_SENDER_DOMAINS.map((domain) => `from:${domain}`)];
  return `{${terms.join(" ")}}`;
}

// --- Addresses -----------------------------------------------------------------------------------

/** Every email address in a From/To/Cc header value, lower-cased. */
export function parseAddresses(header: string | undefined): string[] {
  if (!header) return [];
  const matches = header.match(/[^\s<>,;:"()]+@[^\s<>,;:"()]+\.[^\s<>,;:"()]+/g) ?? [];
  return matches.map((address) => address.toLowerCase());
}

/**
 * One canonical form per mailbox: lower-case, "+tag" dropped, and for Gmail the dots in the local
 * part dropped too (Gmail ignores them), so "Lucas.Harrop+jobs@gmail.com" and
 * "lucasharrop@googlemail.com" compare equal.
 */
export function canonicalAddress(address: string): string {
  const [rawLocal, rawDomain] = address.trim().toLowerCase().split("@");
  if (!rawLocal || !rawDomain) return address.trim().toLowerCase();
  let local = rawLocal.split("+")[0];
  let domain = rawDomain;
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

export function senderDomain(from: string | undefined): string {
  const address = parseAddresses(from)[0] ?? "";
  return address.split("@")[1] ?? "";
}

function domainMatches(domain: string, list: readonly string[]): boolean {
  return list.some((entry) => domain === entry || domain.endsWith(`.${entry}`));
}

// --- Pre-filter ----------------------------------------------------------------------------------

export interface MessageHeaders {
  from?: string;
  to?: string;
  cc?: string;
  subject?: string;
  listUnsubscribe?: string;
  listId?: string;
  snippet?: string;
}

export type SkipReason = "not-addressed-to-you" | "newsletter" | "job-alert" | "no-application-keywords";

export type PrefilterResult = { keep: true } | { keep: false; reason: SkipReason };

const JOB_ALERT_SUBJECT =
  /\b(job alerts?|jobs? (for|matching|picked for) you|new (jobs|roles|opportunities|vacancies)|recommended (jobs|roles|for you)|top (jobs|picks)|weekly|digest|newsletter|webinar|events? (this|next) week|jobs you might like|still hiring|apply now|deadlines? (this|next) week)\b/i;

const APPLICATION_KEYWORDS =
  /\b(application|applying|applied|interview|assessment|online test|hirevue|offer|unfortunately|regret|candidate|candidacy|next steps?|shortlist|unsuccessful|progress(ed|ing)?)\b/i;

/**
 * Cheap checks on headers only, before anything is downloaded in full or sent to the AI.
 *
 * - Must be addressed to you: one of `ownAddresses` in To or Cc. Delivered-To is deliberately NOT
 *   used — it's always your own address, even for the spam sent to random "@web.de" recipients
 *   with you in Bcc, which is exactly what this check is here to drop. Mail sent only to
 *   "undisclosed-recipients" is dropped too.
 * - Not from a job board's alert/marketing domain (Bright Network, Gradcracker, ...).
 * - Not an alert/digest by its subject, unless it comes from an ATS.
 * - Mentions something application-shaped, or comes from an ATS.
 */
export function prefilterMessage(headers: MessageHeaders, ownAddresses: string[]): PrefilterResult {
  const own = new Set(ownAddresses.map(canonicalAddress));
  const recipients = [...parseAddresses(headers.to), ...parseAddresses(headers.cc)];
  if (!recipients.some((address) => own.has(canonicalAddress(address)))) {
    return { keep: false, reason: "not-addressed-to-you" };
  }

  const domain = senderDomain(headers.from);
  if (domainMatches(domain, NEWSLETTER_SENDER_DOMAINS)) return { keep: false, reason: "newsletter" };

  const fromAts = domainMatches(domain, ATS_SENDER_DOMAINS);
  const subject = headers.subject ?? "";
  if (!fromAts && JOB_ALERT_SUBJECT.test(subject)) return { keep: false, reason: "job-alert" };

  if (!fromAts && !APPLICATION_KEYWORDS.test(`${subject} ${headers.snippet ?? ""}`)) {
    return { keep: false, reason: "no-application-keywords" };
  }
  return { keep: true };
}

// --- Classification → pipeline stage ------------------------------------------------------------

/** What the AI may say an email is about. Anything else is treated as "other". */
export const EMAIL_EVENTS = [
  "applied",
  "online_assessment",
  "video_interview",
  "interview",
  "assessment_centre",
  "offer",
  "rejected",
  "withdrawn",
  "other",
] as const;
export type EmailEvent = (typeof EMAIL_EVENTS)[number];

/**
 * Maps an email event onto the app's real stages (see ApplicationStatus in schema.prisma). The
 * app has one interview stage, VIDEO_INTERVIEW, so every kind of interview lands there, as does an
 * assessment centre (the last step before an offer). "other" maps to nothing: no proposal.
 */
export function eventToStatus(event: string): ApplicationStatus | null {
  switch (event) {
    case "applied":
      return "APPLIED";
    case "online_assessment":
      return "ONLINE_ASSESSMENT";
    case "video_interview":
    case "interview":
    case "assessment_centre":
      return "VIDEO_INTERVIEW";
    case "offer":
      return "OFFER";
    case "rejected":
      return "REJECTED";
    case "withdrawn":
      return "WITHDRAWN";
    default:
      return null;
  }
}

// Position along the pipeline for the forward-only rule. REJECTED/WITHDRAWN aren't on it: they're
// handled separately below.
const PIPELINE_ORDER: ApplicationStatus[] = [
  "INTERESTED",
  "NOT_STARTED",
  "PREPARING",
  "APPLIED",
  "ONLINE_ASSESSMENT",
  "VIDEO_INTERVIEW",
  "OFFER",
];
const CLOSED: ApplicationStatus[] = ["OFFER", "REJECTED", "WITHDRAWN"];

/**
 * Whether an email should propose moving an application from `current` to `target`. Only ever
 * forwards along the pipeline (an old "thanks for applying" must not drag an interview back to
 * Applied), except that a rejection or an offer always counts — they're decisive whatever stage
 * the app thinks you're at. A withdrawal only applies to something still open.
 */
export function shouldProposeStatusChange(current: ApplicationStatus, target: ApplicationStatus): boolean {
  if (current === target) return false;
  if (target === "REJECTED" || target === "OFFER") return true;
  if (CLOSED.includes(current)) return false;
  if (target === "WITHDRAWN") return true;
  return PIPELINE_ORDER.indexOf(target) > PIPELINE_ORDER.indexOf(current);
}

// --- Matching ------------------------------------------------------------------------------------

export interface MatchCandidate {
  id: string;
  company: string;
  title: string;
  jobUrl: string | null;
  status: ApplicationStatus;
  archived?: boolean;
  updatedAt?: Date;
}

export interface Extracted {
  company: string;
  roleTitle: string;
  jobUrl?: string | null;
}

// Words that say nothing about WHICH role it is — every grad scheme title has some of them.
const ROLE_STOPWORDS = new Set([
  "graduate",
  "grad",
  "programme",
  "program",
  "scheme",
  "role",
  "position",
  "intern",
  "internship",
  "placement",
  "year",
  "industrial",
  "summer",
  "the",
  "and",
  "of",
  "in",
  "for",
  "a",
  "an",
  "uk",
  "london",
  "entry",
  "level",
  "trainee",
]);

function roleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((word) => word && !ROLE_STOPWORDS.has(word) && !/^(19|20)\d\d$/.test(word))
  );
}

/** 0..1: how alike two role titles are, ignoring generic grad-scheme words and years. */
export function roleSimilarity(a: string, b: string): number {
  const ta = roleTokens(a);
  const tb = roleTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const token of ta) if (tb.has(token)) shared++;
  const jaccard = shared / (ta.size + tb.size - shared);
  const fuzzy = similarity([...ta].sort().join(" "), [...tb].sort().join(" "));
  return Math.max(jaccard, fuzzy);
}

function normalizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

/** Below this, two roles at the same company are treated as different applications. */
export const ROLE_MATCH_THRESHOLD = 0.5;

export interface MatchResult<T extends MatchCandidate> {
  candidate: T;
  /** 0..1, for display. */
  score: number;
}

/**
 * The existing application an email is about, or null if it looks like a new one.
 *
 * 1. Same job URL → that one.
 * 2. Otherwise the company has to fuzzy-match (lib/fuzzy's looksLikeDuplicate, the same rule as
 *    the "possible duplicate employer" warning). Among those:
 *    - a role title that matches well enough wins (best score);
 *    - if the email didn't name a role, or it's vague, and you only have ONE application at that
 *      company, it's that one (ATS mail often just says "your application");
 *    - with several applications at the company and no clear role match, prefer one that's still
 *      open and most recently touched — but only when the email gave no role at all; a named role
 *      that matches none of them is a new application.
 */
export function matchApplication<T extends MatchCandidate>(extracted: Extracted, candidates: T[]): MatchResult<T> | null {
  const url = normalizeUrl(extracted.jobUrl);
  if (url) {
    const byUrl = candidates.find((candidate) => normalizeUrl(candidate.jobUrl) === url);
    if (byUrl) return { candidate: byUrl, score: 1 };
  }

  if (!normalizeCompanyName(extracted.company)) return null;
  const sameCompany = candidates.filter((candidate) => looksLikeDuplicate(candidate.company, extracted.company));
  if (sameCompany.length === 0) return null;

  const roleGiven = roleTokens(extracted.roleTitle).size > 0;
  const scored = sameCompany
    .map((candidate) => ({ candidate, role: roleGiven ? roleSimilarity(candidate.title, extracted.roleTitle) : 0 }))
    .sort((a, b) => b.role - a.role);

  const best = scored[0];
  if (best.role >= ROLE_MATCH_THRESHOLD) return { candidate: best.candidate, score: 0.5 + best.role / 2 };

  if (sameCompany.length === 1) {
    // One application at this company. If the email names a clearly different role, it's a new
    // application; a vague or missing role is assumed to be this one.
    if (roleGiven && best.role < 0.2 && roleTokens(best.candidate.title).size > 0) return null;
    return { candidate: best.candidate, score: 0.6 };
  }

  if (!roleGiven) {
    const open = sameCompany.filter((candidate) => !CLOSED.includes(candidate.status) && !candidate.archived);
    const pool = open.length > 0 ? open : sameCompany;
    const latest = [...pool].sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))[0];
    return { candidate: latest, score: 0.5 };
  }
  return null;
}

// --- Planning (dedupe across emails and pending proposals) ---------------------------------------

export interface ClassifiedEmail {
  messageId: string;
  company: string;
  roleTitle: string;
  jobUrl?: string | null;
  event: string;
  confidence: number;
}

export interface PendingProposal {
  id: string;
  kind: "NEW_APPLICATION" | "STATUS_CHANGE";
  applicationId: string | null;
  company: string;
  roleTitle: string;
  jobUrl: string | null;
  proposedStatus: ApplicationStatus;
}

export type PlanStep =
  | { type: "skip"; messageId: string; outcome: "irrelevant" | "no-change" | "duplicate" }
  | {
      type: "create";
      messageId: string;
      kind: "NEW_APPLICATION" | "STATUS_CHANGE";
      applicationId: string | null;
      fromStatus: ApplicationStatus | null;
      proposedStatus: ApplicationStatus;
      matchScore: number | null;
    }
  | { type: "supersede"; messageId: string; proposalId: string; proposedStatus: ApplicationStatus };

/** Below this the AI wasn't sure enough the email is about an application to bother you with it. */
export const MIN_CONFIDENCE = 0.4;

/**
 * Turns a scan's classified emails (oldest first) into proposal changes, so the review list has at
 * most one pending proposal per application, however many emails arrived about it:
 *
 * - an email about an application that already has a PENDING proposal (from an earlier scan or an
 *   earlier email in this one) moves that proposal forward instead of adding another — e.g.
 *   "application received" then "complete your online test" becomes ONE new application at
 *   Online Assessment — or, if it wouldn't move it forward, is a duplicate;
 * - otherwise it's matched to an existing application (status change, forward-only) or proposed
 *   as a new one.
 *
 * Pure: `applications` and `pending` are snapshots; the steps say what to write.
 */
export function planProposals(
  emails: ClassifiedEmail[],
  applications: MatchCandidate[],
  pending: PendingProposal[]
): PlanStep[] {
  const steps: PlanStep[] = [];
  // Mutable working copy: proposals created earlier in this same plan count as pending too.
  const open = pending.map((proposal) => ({ ...proposal }));
  let created = 0;

  for (const email of emails) {
    const target = eventToStatus(email.event);
    if (!target || email.confidence < MIN_CONFIDENCE || !email.company.trim()) {
      steps.push({ type: "skip", messageId: email.messageId, outcome: "irrelevant" });
      continue;
    }

    const match = matchApplication(email, applications);

    // Already a pending proposal for this application? Fold this email into it.
    const existing = match
      ? open.find((proposal) => proposal.kind === "STATUS_CHANGE" && proposal.applicationId === match.candidate.id)
      : pendingNewApplicationFor(email, open);

    if (existing) {
      if (shouldProposeStatusChange(existing.proposedStatus, target)) {
        existing.proposedStatus = target;
        steps.push({ type: "supersede", messageId: email.messageId, proposalId: existing.id, proposedStatus: target });
      } else {
        steps.push({ type: "skip", messageId: email.messageId, outcome: "duplicate" });
      }
      continue;
    }

    if (match) {
      const current = match.candidate.status;
      if (!shouldProposeStatusChange(current, target)) {
        steps.push({ type: "skip", messageId: email.messageId, outcome: "no-change" });
        continue;
      }
      const id = `new:${created++}`;
      open.push({
        id,
        kind: "STATUS_CHANGE",
        applicationId: match.candidate.id,
        company: match.candidate.company,
        roleTitle: match.candidate.title,
        jobUrl: match.candidate.jobUrl,
        proposedStatus: target,
      });
      steps.push({
        type: "create",
        messageId: email.messageId,
        kind: "STATUS_CHANGE",
        applicationId: match.candidate.id,
        fromStatus: current,
        proposedStatus: target,
        matchScore: match.score,
      });
      continue;
    }

    // A new application. A first email that's already a rejection or withdrawal is still worth
    // recording (it's an application you made), so it's proposed at that status.
    const id = `new:${created++}`;
    open.push({
      id,
      kind: "NEW_APPLICATION",
      applicationId: null,
      company: email.company,
      roleTitle: email.roleTitle,
      jobUrl: email.jobUrl ?? null,
      proposedStatus: target,
    });
    steps.push({
      type: "create",
      messageId: email.messageId,
      kind: "NEW_APPLICATION",
      applicationId: null,
      fromStatus: null,
      proposedStatus: target,
      matchScore: null,
    });
  }
  return steps;
}

function pendingNewApplicationFor(email: ClassifiedEmail, open: PendingProposal[]): PendingProposal | undefined {
  const pendingNew = open.filter((proposal) => proposal.kind === "NEW_APPLICATION");
  const match = matchApplication(
    email,
    pendingNew.map((proposal) => ({
      id: proposal.id,
      company: proposal.company,
      title: proposal.roleTitle,
      jobUrl: proposal.jobUrl,
      status: proposal.proposedStatus,
    }))
  );
  return match ? pendingNew.find((proposal) => proposal.id === match.candidate.id) : undefined;
}

/** The message ids not yet in the processed ledger, in the order given. */
export function unprocessedIds(ids: string[], processed: Iterable<string>): string[] {
  const seen = new Set(processed);
  const result: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id); // also drops repeats within `ids` itself
    result.push(id);
  }
  return result;
}

// --- Message bodies ------------------------------------------------------------------------------

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

// --- Inbound addresses ---------------------------------------------------------------------------

/** A new inbox token: 12 characters of [a-z0-9] (~62 bits), safe as an email local part. */
export function newInboxToken(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  return [...randomBytes(12)].map((byte) => alphabet[byte % alphabet.length]).join("");
}

/** The inbox token an inbound message was sent to, or null if it wasn't addressed to `domain`. */
export function inboxTokenFromRecipient(recipient: string, domain: string): string | null {
  const [local, host] = recipient.trim().toLowerCase().split("@");
  if (!local || host !== domain.trim().toLowerCase()) return null;
  // Tolerate "token+anything", which some providers and people add.
  const token = local.split("+")[0];
  return /^[a-z0-9]{8,32}$/.test(token) ? token : null;
}

/**
 * The dedupe key for one email: its Message-ID when it has one (the same email forwarded twice —
 * by the filter and again as an attachment — keeps its Message-ID), else a hash of what's left.
 */
export function messageKeyFor(email: { messageId?: string | null; from?: string; subject?: string; date?: string | null }): string {
  const id = email.messageId?.trim().replace(/^<|>$/g, "").toLowerCase();
  if (id) return `mid:${id}`;
  return `hash:${createHash("sha256").update(`${email.from ?? ""}\n${email.subject ?? ""}\n${email.date ?? ""}`).digest("hex").slice(0, 40)}`;
}

/** Link to find an email in Gmail by its Message-ID (works whichever mailbox it's in). */
export function gmailSearchUrl(messageId: string): string {
  return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(`rfc822msgid:${messageId.replace(/^<|>$/g, "")}`)}`;
}

// --- Gmail forwarding confirmation ---------------------------------------------------------------

export interface ForwardingConfirmation {
  code: string | null;
  url: string | null;
  /** The Gmail address asking to forward here. */
  from: string | null;
}

/**
 * Gmail sends a confirmation to a new forwarding address before it will forward anything:
 * From forwarding-noreply@google.com, subject "(#123456789) Gmail Forwarding Confirmation -
 * Receive Mail from someone@gmail.com", with a confirmation link and code in the body. Returns
 * what the user needs to finish setup, or null if `email` isn't one.
 */
export function parseForwardingConfirmation(email: { from?: string; subject?: string; text?: string }): ForwardingConfirmation | null {
  const fromAddress = parseAddresses(email.from)[0] ?? "";
  const subject = email.subject ?? "";
  if (fromAddress !== "forwarding-noreply@google.com" || !/forwarding confirmation/i.test(subject)) return null;
  const text = email.text ?? "";
  const code = subject.match(/\(#(\d{5,})\)/)?.[1] ?? text.match(/confirmation code:\s*(\d{5,})/i)?.[1] ?? null;
  const url = text.match(/https:\/\/(?:mail-settings\.google\.com|mail\.google\.com|isolated\.mail\.google\.com)\/\S+/)?.[0] ?? null;
  const requester = subject.match(/receive mail from\s+(\S+@\S+)/i)?.[1] ?? text.match(/(\S+@\S+) has requested/i)?.[1] ?? null;
  return { code, url, from: requester ? parseAddresses(requester)[0] ?? null : null };
}

// --- Inline forwards ----------------------------------------------------------------------------

export interface InlineForward {
  from: string;
  to: string;
  cc: string;
  subject: string;
  date: string;
  text: string;
}

const FORWARD_MARKER = /^-{2,}\s*(forwarded message|original message)\s*-{2,}\s*$/im;

/**
 * The email inside a manual "Forward" (Gmail's "---------- Forwarded message ---------" block, or
 * Outlook's "-----Original Message-----"), or null if `text` doesn't contain one.
 */
export function parseInlineForward(text: string): InlineForward | null {
  const marker = FORWARD_MARKER.exec(text);
  if (!marker) return null;
  const rest = text.slice(marker.index + marker[0].length).replace(/^\s*\n/, "");
  const lines = rest.split(/\r?\n/);
  const headers: Record<string, string> = {};
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (Object.keys(headers).length > 0) break;
      continue;
    }
    const match = line.match(/^(from|to|cc|subject|date|sent):\s*(.*)$/i);
    if (!match) break;
    headers[match[1].toLowerCase() === "sent" ? "date" : match[1].toLowerCase()] = match[2];
  }
  if (!headers.from) return null;
  return {
    from: headers.from,
    to: headers.to ?? "",
    cc: headers.cc ?? "",
    subject: headers.subject ?? "",
    date: headers.date ?? "",
    text: lines.slice(i).join("\n").trim(),
  };
}

export type EmailOutcomeTone = "waiting" | "suggested" | "ignored";

/**
 * What happened to a received email, in words for the "Received emails" list on the Email import
 * page, so nobody has to guess why something didn't become a suggestion.
 */
export function describeEmailOutcome(status: string, outcome: string | null): { label: string; tone: EmailOutcomeTone } {
  if (status !== "DONE") return { label: "Waiting to be read", tone: "waiting" };
  switch (outcome) {
    case "proposed":
      return { label: "Suggestion made", tone: "suggested" };
    case "no-change":
      return { label: "No change: the application is already at this stage", tone: "ignored" };
    case "duplicate":
      return { label: "Same update as another email", tone: "ignored" };
    case "irrelevant":
    case "skipped:no-application-keywords":
      return { label: "Not about an application", tone: "ignored" };
    case "skipped:not-addressed-to-you":
      return { label: "Ignored: not sent to one of your addresses", tone: "ignored" };
    case "skipped:newsletter":
      return { label: "Ignored: job-board newsletter", tone: "ignored" };
    case "skipped:job-alert":
      return { label: "Ignored: job alert", tone: "ignored" };
    default:
      return { label: "Read, no suggestion", tone: "ignored" };
  }
}
