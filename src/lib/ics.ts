// A minimal, hand-rolled .ics (iCalendar) builder — the app has no date/calendar library
// installed, and a single VEVENT is simple enough not to warrant adding one.
// See RFC 5545 for the full format; this covers just what a calendar app needs to show one event.

/** UTC, "basic" format: YYYYMMDDTHHMMSSZ — the form RFC 5545 calls a UTC DATE-TIME. */
export function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Folds long lines and escapes the handful of characters RFC 5545 requires (comma, semicolon,
// backslash, and newlines become literal "\n"). Line folding isn't done here — every field this
// app supplies (a subject, a location, short notes) comfortably fits on one line — but escaping
// is, since notes can contain commas or line breaks.
function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export interface IcsEvent {
  uid: string;
  summary: string;
  /** When the event starts. */
  start: Date;
  /** Defaults to one hour after `start` — the app doesn't capture an end time. */
  end?: Date;
  location?: string | null;
  description?: string | null;
}

export function buildIcsEvent(event: IcsEvent): string {
  const end = event.end ?? new Date(event.start.getTime() + 60 * 60 * 1000);
  const now = toIcsDate(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GradPonto//Activity Export//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsDate(event.start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
  ];

  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);

  lines.push("END:VEVENT", "END:VCALENDAR");

  // RFC 5545 requires CRLF line endings.
  return lines.join("\r\n") + "\r\n";
}
