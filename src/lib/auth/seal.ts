import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

// No "server-only" guard here (same reasoning as oauth-core.ts): pure crypto with the secret
// passed in, so tests can import it through the plain node:test runner.
//
// Encrypts a secret we have to keep and use again later (the Gmail refresh token), as opposed to
// one we only ever compare against (codes, sessions), which are hashed instead. AES-256-GCM, so a
// value that was tampered with fails to open rather than decrypting to garbage. The key is derived
// from AUTH_SECRET with HKDF, bound to `purpose`, so it's never the raw signing secret and a value
// sealed for one purpose can't be opened as another. Rotating AUTH_SECRET makes every sealed value
// unreadable — for the Gmail token that just means reconnecting.

const VERSION = "v1";

function keyFor(secret: string, purpose: string): Buffer {
  return Buffer.from(hkdfSync("sha256", secret, "gradponto-seal", purpose, 32));
}

export function sealSecret(plaintext: string, secret: string, purpose: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFor(secret, purpose), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

/** The original plaintext, or null if the value is malformed, was tampered with, or was sealed with another secret/purpose. */
export function openSecret(sealed: string, secret: string, purpose: string): string | null {
  const [version, iv, tag, ciphertext] = sealed.split(".");
  if (version !== VERSION || !iv || !tag || ciphertext === undefined) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", keyFor(secret, purpose), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
