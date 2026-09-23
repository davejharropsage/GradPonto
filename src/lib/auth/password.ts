import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";

// No "server-only" guard here (unlike most of src/lib/auth/**): this module is pure crypto/zod,
// with no secrets or server-only APIs baked in, and tests/password.test.ts imports it directly
// through the plain node:test runner — the same reasoning that keeps lib/ics.ts and
// lib/cv/serialize.ts free of the guard too.

// No password-hashing library (bcrypt/argon2/etc.) is installed anywhere in this app, and adding
// one for this alone isn't worth it — Node's built-in scrypt is a well-regarded, purpose-built KDF
// available with no new dependency, matching how this app prefers to hand-roll a small piece over
// pulling in a package for it (see also lib/ics.ts).

const KEY_LENGTH = 64;
// scrypt's CPU/memory cost parameter. Stored alongside the hash (not hardcoded at verify time) so
// it can be tuned later — as hardware gets faster — without invalidating passwords hashed earlier.
const COST_PARAM = 16384;

/** Hashes a plaintext password into a self-describing string: `scrypt:<N>:<saltHex>:<hashHex>`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH, { N: COST_PARAM });
  return `scrypt:${COST_PARAM}:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** Checks a plaintext password against a hash produced by `hashPassword`. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const [, nStr, saltHex, hashHex] = parts;

  const cost = Number(nStr);
  if (!Number.isInteger(cost) || cost <= 0) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (expected.length === 0) return false;

  const actual = scryptSync(password, salt, expected.length, { N: cost });
  return timingSafeEqual(actual, expected);
}

// Deliberately just a length floor, not composition rules ("must contain a symbol"). Current
// guidance (NIST SP 800-63B) treats forced composition rules as counterproductive — they push
// people toward predictable substitutions ("Password1!") rather than actually stronger passwords.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(200, "That password is too long.");
