export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string) {
  const d = new Date(date);
  const diffMs = d.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const abs = Math.abs(diffMinutes);
  if (abs < 60) return rtf.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

export function daysUntil(date: Date | string) {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: Date | string) {
  return daysUntil(date) < 0;
}

// Shows the time too, but only when one was actually set — a plain date (still stored as
// midnight local time under the hood, from the older date-only inputs) just shows the date.
export function formatDateTime(date: Date | string) {
  const d = new Date(date);
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  return hasTime
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(d)
    : formatDate(d);
}

// A <input type="datetime-local"> value in the browser's own local time. Using
// `.toISOString()` here would shift the displayed time by the timezone offset, since that
// formats in UTC.
export function toDatetimeLocalValue(date: Date | string) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
