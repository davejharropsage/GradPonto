// Run with:  npm test
// Uses Node's built-in test runner. The examples below are real listings from the earlier
// Adzuna results, so they document the behaviour that motivated each rule.
import test from "node:test";
import assert from "node:assert/strict";
import {
  classify,
  cleanText,
  dedupeKey,
  formatSalary,
  keywordScore,
  parseKeywords,
  rankListings,
  truncate,
} from "../src/lib/jobs/listing.ts";

const raw = (title: string, employer: string, snippet = "", location = "London", id = title + employer + location) => ({
  id,
  title,
  employer,
  location,
  url: "https://www.adzuna.co.uk/jobs/land/ad/" + encodeURIComponent(id),
  postedDate: "2026-09-10T00:00:00Z",
  snippet,
  salary: null,
});

test("parseKeywords splits on commas, trims, de-duplicates and caps the list", () => {
  assert.deepEqual(parseKeywords(" data analytics ,  Business Studies,data analytics ,, "), ["data analytics", "Business Studies"]);
  assert.equal(parseKeywords("a,b,c,d,e,f,g").length, 5);
  assert.equal(parseKeywords("x".repeat(200))[0].length, 40);
  assert.deepEqual(parseKeywords("   "), []);
});

test("cleanText strips the <strong> tags Adzuna adds and decodes entities", () => {
  assert.equal(cleanText("Graduate <strong>Data</strong> Analyst &amp; Insight&nbsp;Team"), "Graduate Data Analyst & Insight Team");
  assert.equal(cleanText(null), "");
  assert.equal(cleanText("<script>alert(1)</script>Hello"), "alert(1) Hello");
});

test("truncate cuts at a word boundary and adds an ellipsis", () => {
  assert.equal(truncate("short", 20), "short");
  const t = truncate("one two three four five six seven", 15);
  assert.ok(t.endsWith("…") && t.length <= 16, t);
  assert.ok(!t.includes("thr…") || t.endsWith("three…"));
});

test("a title hit is worth more than a description hit, and each keyword counts once per field", () => {
  const title = keywordScore({ title: "Data Analytics Placement", snippet: "General role." }, ["data analytics"]);
  const snippetOnly = keywordScore({ title: "Graduate Scheme", snippet: "Focus on data analytics tasks." }, ["data analytics"]);
  assert.equal(title.score, 3);
  assert.equal(snippetOnly.score, 1);
  const both = keywordScore({ title: "Data analytics", snippet: "data analytics data analytics" }, ["data analytics"]);
  assert.equal(both.score, 4);
});

test("keyword matching is whole-word: 'data' does not match 'database'", () => {
  assert.equal(keywordScore({ title: "Database Administrator", snippet: "" }, ["data"]).score, 0);
  assert.equal(keywordScore({ title: "Data Entry Clerk", snippet: "" }, ["data"]).score, 3);
});

test("regex characters in keywords are treated as plain text", () => {
  assert.doesNotThrow(() => keywordScore({ title: "C++ Developer", snippet: "" }, ["c++", "(x", "[a"]));
  assert.equal(keywordScore({ title: "Node.js Intern", snippet: "" }, ["node.js"]).score, 3);
});

test("classify: a Placement Officer arranges placements, a Placement Student does one", () => {
  assert.equal(classify("Industry Placement Officer", "").staffRole, true);
  assert.equal(classify("Industry Placement Officer", "").studentFriendly, false);
  assert.equal(classify("Learner Industry Placement Adviser", "").studentFriendly, false);
  assert.equal(classify("HR Placement Student", "").studentFriendly, true);
  assert.equal(classify("Data Analyst Placement", "").studentFriendly, true);
  assert.equal(classify("Temporary Industrial Placement- HMI Engineer", "").studentFriendly, true);
  assert.equal(classify("Summer Intern, Marketing", "").studentFriendly, true);
  assert.equal(classify("Degree Apprentice Engineer", "").studentFriendly, true);
  assert.equal(classify("Head of Data Analytics", "").staffRole, true);
  assert.equal(classify("Senior Data Analytics Manager", "").staffRole, true);
  assert.equal(classify("Lead Generation Intern", "").staffRole, false, "an explicit intern role is never demoted");
});

test("classify: fee-charging courses are recognised from the snippet", () => {
  const snippet = "Data Analyst Placement Programme. This is a self-funded programme that leads to employment, fees apply. Job Guarantee.";
  assert.equal(classify("Data Analyst Placement Programme No Experience Needed", snippet).paidCourse, true);
  assert.equal(classify("Data Analyst Placement", "Join our analytics team for a year.").paidCourse, false);
});

test("rankListings: keeps only matches, orders by score, and pushes staff roles down", () => {
  const ranked = rankListings(
    [
      raw("Industry Placement Officer", "College A", "Manage industry placements for learners."),
      raw("Data Analyst Placement", "Acme", "Analytics year in industry."),
      raw("Chef", "Kitchen Co", "Cooking."),
      raw("Graduate Scheme", "Bank", "You will work on placement rotations."),
    ],
    ["placement"]
  );
  assert.deepEqual(ranked.map((r) => r.title), ["Data Analyst Placement", "Graduate Scheme", "Industry Placement Officer"]);
  assert.equal(ranked.at(-1)!.staffRole, true, "the officer who arranges placements is ranked last, not removed");
  assert.ok(!ranked.some((r) => r.title === "Chef"), "listings matching no keyword are dropped");
  assert.ok(ranked[0].score > ranked[1].score && ranked[1].score > ranked[2].score);
});

test("rankListings: duplicates (employer + title + location, ignoring case and spacing) collapse to one", () => {
  const ranked = rankListings(
    [raw("Data Intern", "Acme Ltd", "data", "London", "1"), raw("  data intern ", "ACME LTD", "data", "london", "2"), raw("Data Intern", "Acme Ltd", "data", "Leeds", "3")],
    ["data"]
  );
  assert.equal(ranked.length, 2);
  assert.equal(dedupeKey({ employer: " ACME  Ltd", title: "Data  Intern", location: "London" }), "acme ltd|data intern|london");
});

test("rankListings: more matched keywords rank higher on a score tie", () => {
  const ranked = rankListings(
    [raw("Data Entry Clerk", "A", ""), raw("Data Analytics Intern", "B", "")],
    ["data", "analytics"]
  );
  assert.equal(ranked[0].title, "Data Analytics Intern");
});

test("formatSalary shows a range, a single figure, or nothing", () => {
  assert.equal(formatSalary(28102, 30012), "£28,102 – £30,012");
  assert.equal(formatSalary(30000, 30000), "£30,000");
  assert.equal(formatSalary(null, 45000), "£45,000");
  assert.equal(formatSalary(0, 0), null);
  assert.equal(formatSalary(undefined, undefined), null);
});
