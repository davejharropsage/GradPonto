// Run with:  npm test
import test from "node:test";
import assert from "node:assert/strict";
import { serializeStructuredCv, type StructuredCv } from "../src/lib/cv/serialize.ts";

const empty: StructuredCv = { experiences: [], educations: [], skills: [], projects: [] };

test("an empty CV serializes to an empty string", () => {
  assert.equal(serializeStructuredCv(empty), "");
});

test("headline and summary come first, with a blank line between them", () => {
  const out = serializeStructuredCv({ ...empty, headline: "Graduate Data Analyst", summary: "Keen and numerate." });
  assert.equal(out, "Graduate Data Analyst\n\nKeen and numerate.");
});

test("an experience entry shows title, employer, location and date range, then its bullets", () => {
  const out = serializeStructuredCv({
    ...empty,
    experiences: [
      {
        title: "Data Analyst Intern",
        employer: "Northwind Analytics",
        location: "London",
        startDate: new Date("2024-09-01"),
        endDate: new Date("2025-01-15"),
        current: false,
        bullets: "Built dashboards in Power BI\n\n  Wrote SQL queries  \n",
      },
    ],
  });
  assert.equal(
    out,
    "EXPERIENCE\nData Analyst Intern, Northwind Analytics — London (Sep 2024 – Jan 2025)\n- Built dashboards in Power BI\n- Wrote SQL queries"
  );
});

test("a current role shows 'Present' instead of an end date", () => {
  const out = serializeStructuredCv({
    ...empty,
    experiences: [{ title: "Analyst", employer: "Acme", startDate: new Date("2025-01-01"), endDate: null, current: true, bullets: "" }],
  });
  assert.match(out, /\(Jan 2025 – Present\)/);
});

test("blank bullet lines are dropped, and an entry with no bullets shows no dash lines", () => {
  const out = serializeStructuredCv({
    ...empty,
    experiences: [{ title: "Analyst", employer: "Acme", current: false, bullets: "\n\n  \n" }],
  });
  assert.equal(out, "EXPERIENCE\nAnalyst, Acme");
});

test("education shows qualification, field, institution, date range and grade", () => {
  const out = serializeStructuredCv({
    ...empty,
    educations: [
      {
        institution: "University of Leeds",
        qualification: "BSc",
        field: "Computer Science",
        startDate: new Date("2022-09-01"),
        endDate: new Date("2025-06-01"),
        grade: "2:1",
      },
    ],
  });
  assert.equal(out, "EDUCATION\nBSc in Computer Science, University of Leeds (Sep 2022 – Jun 2025 · 2:1)");
});

test("skills join onto one line", () => {
  const out = serializeStructuredCv({ ...empty, skills: [{ name: "SQL" }, { name: "Python" }, { name: "Power BI" }] });
  assert.equal(out, "SKILLS\nSQL, Python, Power BI");
});

test("a project shows its name, description and link on separate lines", () => {
  const out = serializeStructuredCv({
    ...empty,
    projects: [{ name: "Portfolio site", description: "A small personal site.", link: "https://example.com" }],
  });
  assert.equal(out, "PROJECTS\nPortfolio site\nA small personal site.\nhttps://example.com");
});

test("sections appear in a fixed order, separated by one blank line, only when non-empty", () => {
  const out = serializeStructuredCv({
    headline: "Graduate",
    experiences: [{ title: "Intern", employer: "Acme", current: false, bullets: "" }],
    educations: [],
    skills: [{ name: "SQL" }],
    projects: [],
  });
  assert.equal(out, "Graduate\n\nEXPERIENCE\nIntern, Acme\n\nSKILLS\nSQL");
});
