import { z } from "zod";
import { generateText, extractJson } from "./client";
import { EMAIL_EVENTS, type EmailEvent } from "@/lib/inbound/core";

export interface EmailForClassification {
  /** Echoed back so answers can be paired with emails whatever order the model returns them in. */
  id: string;
  from: string;
  subject: string;
  date: string;
  body: string;
}

export interface EmailClassification {
  id: string;
  isApplicationEmail: boolean;
  company: string;
  roleTitle: string;
  jobUrl: string;
  reference: string;
  event: EmailEvent;
  confidence: number;
}

// Each email's body is capped so a batch fits comfortably in one request; the first couple of
// thousand characters always carry the company, the role and what happened.
const BODY_CHARS = 2500;
/** Emails per AI request — one request per batch keeps a scan well inside the hourly AI allowance. */
export const CLASSIFY_BATCH_SIZE = 8;

const answerSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      isApplicationEmail: z.boolean().catch(false),
      company: z.string().catch(""),
      roleTitle: z.string().catch(""),
      jobUrl: z.string().catch(""),
      reference: z.string().catch(""),
      event: z.enum(EMAIL_EVENTS).catch("other"),
      confidence: z.number().min(0).max(1).catch(0),
    })
  ),
});

/** Classifies up to CLASSIFY_BATCH_SIZE emails in one AI request. Emails the model skipped are left out of the result. */
export async function classifyEmails(emails: EmailForClassification[]): Promise<EmailClassification[]> {
  if (emails.length === 0) return [];
  const raw = await generateText(
    [
      "You read emails from a student's inbox and pick out the ones about a job, internship or placement application THEY made.",
      "Respond with ONLY a JSON object (no markdown fence, no commentary) matching exactly this shape:",
      `{"results": [{"id": string, "isApplicationEmail": boolean, "company": string, "roleTitle": string, "jobUrl": string, "reference": string, "event": string, "confidence": number}]}`,
      "One entry per email, with the email's id copied exactly.",
      "",
      "Rules:",
      '- "isApplicationEmail" is true ONLY for an email from an employer or its recruiting system about an application this person submitted: confirmation it was received, an invitation to a test/interview/assessment centre, an offer, a rejection, or confirmation they withdrew.',
      "- Job alerts, newsletters, recommended jobs, careers-fair or webinar invitations, marketing, and generic recruiter outreach are NOT application emails.",
      '- "company" is the hiring employer (not the job board or the ATS like Workday/Greenhouse). "roleTitle" is the job title as written, or "" if not stated.',
      '- "jobUrl" is a link to the job posting if one is given (not an unsubscribe, login or assessment link), else "". "reference" is a job/requisition/candidate reference number if given, else "".',
      `- "event" is one of: ${EMAIL_EVENTS.map((event) => `"${event}"`).join(", ")}.`,
      '  "applied" = application received/thanks for applying. "online_assessment" = online test, game-based or numerical/verbal reasoning test, coding test.',
      '  "video_interview" = recorded/one-way video interview (e.g. HireVue). "interview" = live interview (phone, video call or in person). "assessment_centre" = assessment centre / final round day.',
      '  "offer" = a job offer. "rejected" = unsuccessful/not progressing. "withdrawn" = confirms the candidate withdrew. "other" = anything else, including reminders with no new step.',
      '- "confidence" is 0..1: how sure you are about isApplicationEmail, company and event together.',
      '- If isApplicationEmail is false, use event "other" and empty strings. Never invent information.',
      "",
      "Emails:",
      JSON.stringify(
        emails.map((email) => ({
          id: email.id,
          from: email.from,
          subject: email.subject,
          date: email.date,
          body: email.body.slice(0, BODY_CHARS),
        }))
      ),
    ].join("\n"),
    { maxTokens: 300 * emails.length + 200 }
  );

  const parsed = answerSchema.safeParse(extractJson<unknown>(raw));
  if (!parsed.success) return [];
  const ids = new Set(emails.map((email) => email.id));
  return parsed.data.results.filter((result) => ids.has(result.id));
}
