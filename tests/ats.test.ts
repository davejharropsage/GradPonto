// Run with:  npm test
import test from "node:test";
import assert from "node:assert/strict";
import { coveragePercent, matchKeywordsToCv } from "../src/lib/cv/ats.ts";

test("matchKeywordsToCv finds whole-word, case-insensitive matches", () => {
  const cv = "Experienced with SQL, Python and cross-functional collaboration. Studied at university.";
  const result = matchKeywordsToCv(["SQL", "python", "Excel", "cross-functional collaboration"], cv);
  assert.deepEqual(result, [
    { keyword: "SQL", found: true },
    { keyword: "python", found: true },
    { keyword: "Excel", found: false },
    { keyword: "cross-functional collaboration", found: true },
  ]);
});

test("matching is whole-word: 'SQL' does not match 'MySQL' or 'SQLite'", () => {
  const result = matchKeywordsToCv(["SQL"], "Built a small app on MySQL and SQLite.");
  assert.equal(result[0].found, false);
});

test("regex characters in a keyword are treated as literal text, not a pattern", () => {
  const result = matchKeywordsToCv(["C++", "2:1 degree"], "Wrote C++ for three years and hold a 2:1 degree.");
  assert.deepEqual(result.map((r) => r.found), [true, true]);
});

test("an empty keyword list or empty CV text never matches", () => {
  assert.deepEqual(matchKeywordsToCv([], "some CV text"), []);
  assert.equal(matchKeywordsToCv(["SQL"], "")[0].found, false);
});

test("coveragePercent rounds the share of keywords found, and is 0 for an empty list", () => {
  assert.equal(coveragePercent([]), 0);
  assert.equal(
    coveragePercent([
      { keyword: "a", found: true },
      { keyword: "b", found: true },
      { keyword: "c", found: false },
    ]),
    67
  );
  assert.equal(coveragePercent([{ keyword: "a", found: false }]), 0);
  assert.equal(coveragePercent([{ keyword: "a", found: true }]), 100);
});
