import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface OutboxMessage extends Mail {
  id: string;
  sentAt: string;
}

/**
 * How email is delivered:
 *   "smtp"        SMTP_HOST is set: messages are really sent (see .env.example).
 *   "dev-outbox"  no SMTP configured: messages are written to ./.mail-outbox and shown at
 *                 /dev/outbox. Nothing leaves this machine. Only allowed outside production.
 */
export function mailMode(): "smtp" | "dev-outbox" {
  return process.env.SMTP_HOST ? "smtp" : "dev-outbox";
}

const OUTBOX_DIR = path.join(process.cwd(), ".mail-outbox");

export async function sendMail(mail: Mail): Promise<void> {
  if (mailMode() === "smtp") {
    const from = process.env.MAIL_FROM;
    if (!from) throw new Error("MAIL_FROM must be set when SMTP_HOST is set (e.g. \"GradPonto <no-reply@yourdomain>\").");

    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(process.env.SMTP_HOST ?? "");
    // Keep this in step with scripts/send-test-email.mjs, which builds the same connection.
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      // On the STARTTLS ports (usually 587) never fall back to plain text: that would send the
      // SMTP password unencrypted if the server didn't offer TLS.
      requireTLS: !secure && !isLocal,
      // Fail fast: a wrong host must not leave the sign-in form spinning for minutes.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html });
    return;
  }

  // Refuse to silently "send" emails into a folder on a real server: sign-in would look
  // like it worked while nobody ever received a code.
  if (process.env.NODE_ENV === "production") {
    throw new Error("Email is not configured. Set SMTP_HOST, MAIL_FROM and the other SMTP_* variables.");
  }

  await mkdir(OUTBOX_DIR, { recursive: true });
  const message: OutboxMessage = { ...mail, id: `${Date.now()}-${randomBytes(3).toString("hex")}`, sentAt: new Date().toISOString() };
  await writeFile(path.join(OUTBOX_DIR, `${message.id}.json`), JSON.stringify(message, null, 2), "utf8");
  console.log(`[dev mail] To: ${mail.to} | ${mail.subject}  (saved to .mail-outbox, view at /dev/outbox)`);
}

/** Newest first. Development only. */
export async function readOutbox(limit = 25): Promise<OutboxMessage[]> {
  let files: string[];
  try {
    files = (await readdir(OUTBOX_DIR)).filter((f) => f.endsWith(".json")).sort().reverse().slice(0, limit);
  } catch {
    return [];
  }
  return Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(OUTBOX_DIR, f), "utf8")) as OutboxMessage));
}
