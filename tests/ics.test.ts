// Run with:  npm test
import test from "node:test";
import assert from "node:assert/strict";
import { toIcsDate, buildIcsEvent } from "../src/lib/ics.ts";

test("toIcsDate formats a UTC date-time with no separators", () => {
  assert.equal(toIcsDate(new Date("2026-09-22T14:30:00.000Z")), "20260922T143000Z");
});

test("buildIcsEvent defaults to a one-hour slot when no end time is given", () => {
  const out = buildIcsEvent({
    uid: "abc123",
    summary: "Interview: Acme Robotics",
    start: new Date("2026-09-22T14:30:00.000Z"),
  });
  assert.match(out, /DTSTART:20260922T143000Z/);
  assert.match(out, /DTEND:20260922T153000Z/);
});

test("buildIcsEvent includes location and description only when given", () => {
  const withBoth = buildIcsEvent({
    uid: "abc123",
    summary: "Interview",
    start: new Date("2026-09-22T14:30:00.000Z"),
    location: "Zoom",
    description: "Second round",
  });
  assert.match(withBoth, /LOCATION:Zoom/);
  assert.match(withBoth, /DESCRIPTION:Second round/);

  const withNeither = buildIcsEvent({
    uid: "abc123",
    summary: "Interview",
    start: new Date("2026-09-22T14:30:00.000Z"),
  });
  assert.doesNotMatch(withNeither, /LOCATION/);
  assert.doesNotMatch(withNeither, /DESCRIPTION/);
});

test("commas, semicolons and newlines in text fields are escaped", () => {
  const out = buildIcsEvent({
    uid: "abc123",
    summary: "Interview, round 2; final",
    start: new Date("2026-09-22T14:30:00.000Z"),
    description: "Bring:\nCV, references",
  });
  assert.match(out, /SUMMARY:Interview\\, round 2\\; final/);
  assert.match(out, /DESCRIPTION:Bring:\\nCV\\, references/);
});

test("the calendar wraps one VEVENT with a stable PRODID, and uses CRLF line endings", () => {
  const out = buildIcsEvent({
    uid: "abc123",
    summary: "Interview",
    start: new Date("2026-09-22T14:30:00.000Z"),
  });
  assert.match(out, /^BEGIN:VCALENDAR\r\n/);
  assert.match(out, /\r\nEND:VCALENDAR\r\n$/);
  assert.match(out, /PRODID:-\/\/GradPonto\/\/Activity Export\/\/EN/);
});
