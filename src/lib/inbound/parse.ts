import "server-only";
import { simpleParser, type AddressObject } from "mailparser";
import { z } from "zod";
import { htmlToText, messageKeyFor, parseInlineForward } from "./core";

/**
 * Turning what the inbound email provider sends into one shape. Only Postmark is wired up
 * (fromPostmark); another provider is one more adapter producing an IncomingEmail.
 */

export interface IncomingEmail {
  messageId: string | null;
  from: string;
  to: string;
  cc: string;
  subject: string;
  /** As written in the Date header, for the dedupe hash when there's no Message-ID. */
  dateText: string;
  date: Date | null;
  text: string;
  listUnsubscribe: string;
  listId: string;
  /** Raw message/rfc822 attachments: what Gmail's "Forward as attachment" sends. */
  attachedEmails: Buffer[];
}

/** One email to file: the forwarded original, however it arrived. */
export interface CandidateEmail {
  messageKey: string;
  originalMessageId: string | null;
  from: string;
  to: string;
  cc: string;
  subject: string;
  receivedAt: Date;
  text: string;
  listUnsubscribe: string;
  listId: string;
}

// At most this many attached emails are unpacked from one message (Vercel caps a request at
// 4.5 MB anyway, so a real batch is a few dozen).
const MAX_ATTACHED = 100;

// --- Postmark ------------------------------------------------------------------------------------

const postmarkAddress = z.object({ Email: z.string() }).loose();
const postmarkSchema = z
  .object({
    OriginalRecipient: z.string().optional(),
    From: z.string().default(""),
    To: z.string().default(""),
    Cc: z.string().default(""),
    ToFull: z.array(postmarkAddress).default([]),
    CcFull: z.array(postmarkAddress).default([]),
    BccFull: z.array(postmarkAddress).default([]),
    Subject: z.string().default(""),
    Date: z.string().default(""),
    TextBody: z.string().default(""),
    HtmlBody: z.string().default(""),
    Headers: z.array(z.object({ Name: z.string(), Value: z.string() })).default([]),
    Attachments: z
      .array(z.object({ Name: z.string().optional(), ContentType: z.string().default(""), Content: z.string().default("") }).loose())
      .default([]),
  })
  .loose();

export type PostmarkPayload = z.infer<typeof postmarkSchema>;

export function parsePostmarkPayload(body: unknown): PostmarkPayload | null {
  const parsed = postmarkSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

/** Every address the message was delivered to: the envelope recipient first, then To/Cc/Bcc. */
export function postmarkRecipients(payload: PostmarkPayload): string[] {
  return [
    payload.OriginalRecipient ?? "",
    ...payload.ToFull.map((a) => a.Email),
    ...payload.CcFull.map((a) => a.Email),
    ...payload.BccFull.map((a) => a.Email),
  ].filter(Boolean);
}

export function fromPostmark(payload: PostmarkPayload): IncomingEmail {
  const header = (name: string) => payload.Headers.find((h) => h.Name.toLowerCase() === name.toLowerCase())?.Value ?? "";
  const date = payload.Date ? new Date(payload.Date) : null;
  return {
    messageId: header("Message-ID") || null,
    from: payload.From,
    to: payload.To,
    cc: payload.Cc,
    subject: payload.Subject,
    dateText: payload.Date,
    date: date && !Number.isNaN(date.getTime()) ? date : null,
    text: payload.TextBody.trim() || htmlToText(payload.HtmlBody),
    listUnsubscribe: header("List-Unsubscribe"),
    listId: header("List-Id"),
    attachedEmails: payload.Attachments.filter((a) => /^message\/rfc822\b/i.test(a.ContentType) || /\.eml$/i.test(a.Name ?? ""))
      .slice(0, MAX_ATTACHED)
      .map((a) => Buffer.from(a.Content, "base64")),
  };
}

// --- Raw MIME (attached .eml files) --------------------------------------------------------------

function addressText(value: AddressObject | AddressObject[] | undefined): string {
  if (!value) return "";
  return (Array.isArray(value) ? value : [value]).map((a) => a.text).join(", ");
}

export async function parseRawEmail(raw: Buffer): Promise<IncomingEmail> {
  const mail = await simpleParser(raw, { skipImageLinks: true, skipTextToHtml: true });
  const header = (name: string) => {
    const value = mail.headers.get(name.toLowerCase());
    if (!value) return "";
    if (typeof value === "string") return value;
    // Structured headers (List-*) come back as objects; keep a readable form.
    return JSON.stringify(value);
  };
  return {
    messageId: mail.messageId ?? null,
    from: addressText(mail.from),
    to: addressText(mail.to),
    cc: addressText(mail.cc),
    subject: mail.subject ?? "",
    dateText: mail.date?.toISOString() ?? "",
    date: mail.date ?? null,
    text: (mail.text ?? "").trim() || (typeof mail.html === "string" ? htmlToText(mail.html) : ""),
    listUnsubscribe: header("list-unsubscribe"),
    listId: header("list-id"),
    attachedEmails: mail.attachments
      .filter((a) => a.contentType === "message/rfc822")
      .slice(0, MAX_ATTACHED)
      .map((a) => a.content),
  };
}

// --- Unwrapping forwards -------------------------------------------------------------------------

function toCandidate(email: IncomingEmail, fallbackDate: Date): CandidateEmail {
  return {
    messageKey: messageKeyFor({ messageId: email.messageId, from: email.from, subject: email.subject, date: email.dateText }),
    originalMessageId: email.messageId?.replace(/^<|>$/g, "") || null,
    from: email.from,
    to: email.to,
    cc: email.cc,
    subject: email.subject,
    receivedAt: email.date ?? fallbackDate,
    text: email.text,
    listUnsubscribe: email.listUnsubscribe,
    listId: email.listId,
  };
}

/**
 * The original email(s) a message carries:
 * - "Forward as attachment" (one or many) → each attached email;
 * - a manual inline "Fwd:" → the forwarded email parsed out of the body;
 * - otherwise (a Gmail filter's auto-forward keeps the original headers) → the message itself.
 * `wrapperFrom` is set when the message was a wrapper the user sent themselves, so their address
 * can be learned.
 */
export async function unwrapForwards(email: IncomingEmail): Promise<{ wrapperFrom: string | null; emails: CandidateEmail[] }> {
  const now = new Date();
  if (email.attachedEmails.length > 0) {
    const emails: CandidateEmail[] = [];
    for (const raw of email.attachedEmails) {
      try {
        emails.push(toCandidate(await parseRawEmail(raw), email.date ?? now));
      } catch (error) {
        console.error("Couldn't parse an attached email:", error);
      }
    }
    return { wrapperFrom: email.from, emails };
  }

  if (/^\s*(fwd?|fw)\s*:/i.test(email.subject)) {
    const inline = parseInlineForward(email.text);
    if (inline) {
      const date = inline.date ? new Date(inline.date.replace(/ at /, " ")) : null;
      const inner: IncomingEmail = {
        messageId: null,
        from: inline.from,
        to: inline.to,
        cc: inline.cc,
        subject: inline.subject,
        dateText: inline.date,
        date: date && !Number.isNaN(date.getTime()) ? date : null,
        text: inline.text,
        listUnsubscribe: "",
        listId: "",
        attachedEmails: [],
      };
      return { wrapperFrom: email.from, emails: [toCandidate(inner, email.date ?? now)] };
    }
  }

  return { wrapperFrom: null, emails: [toCandidate(email, now)] };
}
