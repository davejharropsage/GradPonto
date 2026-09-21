import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";

/**
 * Fetches a page the user pointed us at, refusing to reach anything on a private network.
 *
 * Why this exists: "import a job from a link" makes OUR SERVER request whatever URL a user
 * types. Now that anyone can register, that would let them probe localhost, the office
 * network or cloud metadata endpoints through us (SSRF). So each hop is checked: the host
 * must resolve only to public addresses, redirects are followed manually (max 3) and
 * re-checked, and the response size is capped.
 *
 * Known limit: the name is resolved once for the check and again by fetch, so a hostile DNS
 * server could in theory answer differently the second time (DNS rebinding). Closing that
 * fully needs an egress proxy or a pinned-IP agent.
 */

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, incl. cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224 // multicast and reserved
  );
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::" || v === "::1") return true;
    if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb")) return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateIPv4(mapped[1]) : false;
  }
  return true; // not an IP we understand: refuse
}

async function assertPublicHost(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http(s) URLs are supported");
  if (url.username || url.password) throw new Error("That address can't be fetched.");

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("That address can't be fetched.");
  }

  const addresses = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
    throw new Error("That address can't be fetched.");
  }
}

const MAX_BYTES = 3 * 1024 * 1024;

export async function fetchPublicPage(startUrl: string, init: { userAgent: string; timeoutMs?: number }): Promise<string> {
  let url = new URL(startUrl); // throws on an invalid URL, caught by the caller

  for (let hop = 0; hop <= 3; hop++) {
    await assertPublicHost(url);

    const res = await fetch(url, {
      headers: { "User-Agent": init.userAgent },
      redirect: "manual",
      signal: AbortSignal.timeout(init.timeoutMs ?? 15000),
    });

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (!res.ok) throw new Error(`Could not fetch that URL (HTTP ${res.status})`);

    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) throw new Error("That page is too large to import.");

    const body = await res.arrayBuffer();
    if (body.byteLength > MAX_BYTES) throw new Error("That page is too large to import.");
    return new TextDecoder().decode(body);
  }

  throw new Error("That link redirects too many times.");
}
