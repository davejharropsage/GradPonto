import { EMAIL_IMPORT_RETENTION_DAYS } from "@/lib/auth/inbound";
import { ColorDot } from "@/components/shared/status-badge";
import { describeEmailOutcome, type EmailOutcomeTone } from "@/lib/inbound/core";
import { formatRelativeTime } from "@/lib/format";

export interface ReceivedEmailView {
  id: string;
  subject: string;
  sender: string;
  status: string;
  outcome: string | null;
  createdAt: Date;
}

const toneDots: Record<EmailOutcomeTone, string> = {
  waiting: "bg-amber-500",
  suggested: "bg-blue-500",
  ignored: "bg-gray-400",
};

/** Every forwarded email GradPonto received, newest first, with what became of it. */
export function ReceivedEmails({ emails, total }: { emails: ReceivedEmailView[]; total: number }) {
  return (
    <section className="space-y-2 text-sm">
      <h2 className="text-lg font-semibold">
        Received emails <span className="text-muted-foreground">({total})</span>
      </h2>
      <p className="text-muted-foreground">
        Everything that reached GradPonto, and what happened to it. Something missing? Emails over about 3&nbsp;MB
        (usually ones with big attachments) can&apos;t be received: forward them again with the attachments removed.
        An email you forward twice is only listed once, and emails are deleted after {EMAIL_IMPORT_RETENTION_DAYS} days (the applications
        they created stay).
      </p>
      {emails.length === 0 ? (
        <p className="rounded-md border px-3 py-6 text-center text-muted-foreground">No emails received yet.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {emails.map((email) => {
            const { label, tone } = describeEmailOutcome(email.status, email.outcome);
            return (
              <li key={email.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-2">
                <span className="min-w-0 flex-1 basis-60 truncate">
                  {email.subject} <span className="text-muted-foreground">· {email.sender}</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ColorDot className={toneDots[tone]} />
                  {label} · {formatRelativeTime(email.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {total > emails.length && (
        <p className="text-xs text-muted-foreground">Showing the latest {emails.length}.</p>
      )}
    </section>
  );
}
