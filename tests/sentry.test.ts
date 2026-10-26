// Run with:  npm test
import test from "node:test";
import assert from "node:assert/strict";
import { scrubEvent, sentryEnabled, sentryOptions, stripQuery } from "../src/lib/sentry-options.ts";

test("stripQuery drops the query string and fragment", () => {
  assert.equal(stripQuery("https://gradponto.com/reset-password?code=123456&email=a%40b.com"), "https://gradponto.com/reset-password");
  assert.equal(stripQuery("/applications/abc#notes"), "/applications/abc");
  assert.equal(stripQuery("/pipeline"), "/pipeline");
});

test("scrubEvent removes cookies, auth and IP headers, bodies, query strings and the user", () => {
  const event = scrubEvent({
    user: { email: "student@uni.ac.uk", ip_address: "81.2.69.160" },
    request: {
      url: "https://gradponto.com/signup/verify?email=student%40uni.ac.uk",
      query_string: "email=student%40uni.ac.uk",
      cookies: { gp_session: "secret" },
      data: { password: "hunter2hunter2" },
      headers: { Cookie: "gp_session=secret", Authorization: "Basic abc", "X-Forwarded-For": "81.2.69.160", "User-Agent": "Mozilla/5.0" },
    },
    breadcrumbs: [
      { data: { from: "/signin?next=%2F", to: "/reset-password?code=123456" } },
      { data: { url: "/api/inbound/postmark?x=1", method: "POST" } },
      {},
    ],
  });
  assert.equal(event.user, undefined);
  assert.deepEqual(event.request, { url: "https://gradponto.com/signup/verify", headers: { "User-Agent": "Mozilla/5.0" } });
  assert.deepEqual(event.breadcrumbs, [
    { data: { from: "/signin", to: "/reset-password" } },
    { data: { url: "/api/inbound/postmark", method: "POST" } },
    {},
  ]);
});

test("scrubEvent strips queries from contexts and performance spans", () => {
  const event = scrubEvent({
    contexts: { nextjs: { request_path: "/goals?email=student%40uni.ac.uk", router_path: "/goals" }, trace: { span_id: "abc" } },
    spans: [{ data: { "http.url": "https://api.example.com/x?key=secret", "url.query": "?key=secret", "http.method": "GET" } }],
  });
  assert.deepEqual(event.contexts, { nextjs: { request_path: "/goals", router_path: "/goals" }, trace: { span_id: "abc" } });
  assert.deepEqual(event.spans, [{ data: { "http.url": "https://api.example.com/x", "http.method": "GET" } }]);
});

test("Sentry is off without a DSN, and never sends default PII", () => {
  const saved = process.env.NEXT_PUBLIC_SENTRY_DSN;
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  assert.equal(sentryEnabled(), false);
  assert.equal(sentryOptions().enabled, false);
  process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@o1.ingest.de.sentry.io/1";
  assert.equal(sentryEnabled(), true);
  assert.equal(sentryOptions().sendDefaultPii, false);
  // Otherwise beforeSendTransaction (and so the trace scrubber) is skipped.
  assert.equal(sentryOptions().traceLifecycle, "static");
  if (saved === undefined) delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  else process.env.NEXT_PUBLIC_SENTRY_DSN = saved;
});
