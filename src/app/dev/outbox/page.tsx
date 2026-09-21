import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mailMode, readOutbox } from "@/lib/auth/mailer";

export const metadata: Metadata = { title: "Dev inbox", robots: { index: false } };

/**
 * DEVELOPMENT ONLY. Shows the emails the app "sent" while no SMTP server is configured, so
 * you can read your sign-in code. It returns 404 in production and whenever real email is
 * set up, so a sign-in code can never be read from here on a live site.
 */
export default async function DevOutboxPage() {
  if (process.env.NODE_ENV === "production" || mailMode() !== "dev-outbox") notFound();

  const messages = await readOutbox();

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-3xl">Dev inbox</h1>
      <p className="text-sm text-muted-foreground">
        Nothing here was really sent: this app has no email service configured (see <code>.env.example</code>). Newest first.
      </p>

      {messages.length === 0 && <p className="rounded-xl bg-muted p-4 text-sm">No emails yet.</p>}

      {messages.map((message) => (
        <article key={message.id} className="rounded-2xl border bg-card p-5">
          <div className="text-xs text-muted-foreground">
            {new Date(message.sentAt).toLocaleString("en-GB")} · To <strong className="text-foreground">{message.to}</strong>
          </div>
          <h2 className="mt-1 text-xl [font-stretch:100%] font-bold">{message.subject}</h2>
          <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-muted p-4 font-sans text-sm">{message.text}</pre>
        </article>
      ))}
    </main>
  );
}
