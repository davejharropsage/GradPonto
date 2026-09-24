// Run with:  npm test
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pkceChallenge, profileFromIdToken, readSignedValue, signValue } from "../src/lib/auth/oauth-core.ts";

const SECRET = "test-secret-that-is-at-least-32-characters-long";
const NOW = Date.UTC(2026, 8, 24, 12, 0, 0);

function idToken(claims: Record<string, unknown>): string {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${part({ alg: "RS256" })}.${part(claims)}.signature`;
}

const googleClaims = {
  iss: "https://accounts.google.com",
  aud: "google-client",
  exp: NOW / 1000 + 600,
  nonce: "the-nonce",
  sub: "1234567890",
  email: "Student@Example.ac.uk",
  email_verified: true,
  name: "Sam Student",
};
const googleExpected = { clientId: "google-client", nonce: "the-nonce" };

test("pkceChallenge is the base64url SHA-256 of the verifier (RFC 7636 S256)", () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  assert.equal(pkceChallenge(verifier), createHash("sha256").update(verifier).digest("base64url"));
  assert.equal(pkceChallenge(verifier), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});

test("signValue round-trips through readSignedValue", () => {
  const signed = signValue({ provider: "google", sub: "abc" }, SECRET, 60, NOW);
  const read = readSignedValue<{ provider: string; sub: string }>(signed, SECRET, NOW + 1000);
  assert.equal(read?.provider, "google");
  assert.equal(read?.sub, "abc");
});

test("readSignedValue rejects a tampered, wrongly-signed or expired value", () => {
  const signed = signValue({ email: "a@example.com" }, SECRET, 60, NOW);
  const [, mac] = signed.split(".");
  const forgedBody = Buffer.from(JSON.stringify({ email: "victim@example.com", exp: NOW + 60_000 })).toString("base64url");
  assert.equal(readSignedValue(`${forgedBody}.${mac}`, SECRET, NOW), null);
  assert.equal(readSignedValue(signed, "a-different-secret-also-32-characters-long", NOW), null);
  assert.equal(readSignedValue(signed, SECRET, NOW + 61_000), null);
  assert.equal(readSignedValue(undefined, SECRET, NOW), null);
  assert.equal(readSignedValue("garbage", SECRET, NOW), null);
});

test("profileFromIdToken reads a valid Google token and lower-cases the email", () => {
  const profile = profileFromIdToken(idToken(googleClaims), "google", googleExpected, NOW);
  assert.deepEqual(profile, { sub: "1234567890", email: "student@example.ac.uk", name: "Sam Student" });
});

test("profileFromIdToken rejects wrong audience, issuer, nonce, expiry or an unverified Google email", () => {
  const cases: Record<string, unknown>[] = [
    { ...googleClaims, aud: "someone-elses-client" },
    { ...googleClaims, iss: "https://evil.example.com" },
    { ...googleClaims, nonce: "replayed-nonce" },
    { ...googleClaims, exp: NOW / 1000 - 1 },
    { ...googleClaims, email_verified: false },
    { ...googleClaims, email: "not-an-email" },
    { ...googleClaims, sub: "" },
  ];
  for (const claims of cases) {
    assert.equal(profileFromIdToken(idToken(claims), "google", googleExpected, NOW), null, JSON.stringify(claims));
  }
  assert.equal(profileFromIdToken("not.a-jwt", "google", googleExpected, NOW), null);
});

test("profileFromIdToken accepts Microsoft's per-tenant issuer and falls back to preferred_username", () => {
  const tid = "9188040d-6c67-4c5b-b112-36a304b66dad";
  const claims = {
    iss: `https://login.microsoftonline.com/${tid}/v2.0`,
    tid,
    aud: "ms-client",
    exp: NOW / 1000 + 600,
    nonce: "n",
    sub: "ms-sub",
    preferred_username: "Someone@Outlook.com",
  };
  const expected = { clientId: "ms-client", nonce: "n" };
  assert.deepEqual(profileFromIdToken(idToken(claims), "microsoft", expected, NOW), {
    sub: "ms-sub",
    email: "someone@outlook.com",
    name: null,
  });
  // An issuer naming a different tenant than the token claims is refused.
  const mismatched = { ...claims, iss: "https://login.microsoftonline.com/another-tenant/v2.0" };
  assert.equal(profileFromIdToken(idToken(mismatched), "microsoft", expected, NOW), null);
});
