import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { authSecret } from "./config";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** HMAC of a sign-in code, bound to the email so a code can't be replayed for another address. */
export function hashLoginCode(email: string, code: string): string {
  return createHmac("sha256", authSecret()).update(`${email}\n${code}`).digest("hex");
}

/** Constant-time comparison of two hex strings of equal length. */
export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
