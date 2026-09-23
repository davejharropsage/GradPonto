// Run with:  npm test
import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/auth/password.ts";

test("verifyPassword accepts the correct password against its own hash", () => {
  const hash = hashPassword("correct horse battery staple");
  assert.equal(verifyPassword("correct horse battery staple", hash), true);
});

test("verifyPassword rejects a wrong password", () => {
  const hash = hashPassword("correct horse battery staple");
  assert.equal(verifyPassword("wrong password entirely", hash), false);
});

test("hashPassword salts each call, so the same password hashes differently each time", () => {
  const a = hashPassword("same password");
  const b = hashPassword("same password");
  assert.notEqual(a, b);
  assert.equal(verifyPassword("same password", a), true);
  assert.equal(verifyPassword("same password", b), true);
});

test("verifyPassword returns false, not throws, for a malformed or foreign stored value", () => {
  assert.equal(verifyPassword("anything", "not-a-real-hash"), false);
  assert.equal(verifyPassword("anything", ""), false);
  assert.equal(verifyPassword("anything", "bcrypt:$2b$10$abcdefg"), false);
});
