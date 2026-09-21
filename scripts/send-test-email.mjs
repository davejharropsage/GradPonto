// Sends one real email using the SMTP settings in .env, so you can check email works before
// trying the full sign-in flow.
//
//   npm run mail:test -- you@example.com
//
// It prints what it is connecting to (never the password) and, if something is wrong, a hint
// about the most likely cause. Keep the connection settings in step with src/lib/auth/mailer.ts.

import nodemailer from "nodemailer";

const to = process.argv[2];
const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

function fail(message, hint) {
  console.error(`\nX ${message}`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
}

if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
  fail("Give the address to send the test to.", "Example:  npm run mail:test -- you@example.com");
}
if (!SMTP_HOST) {
  fail("SMTP_HOST is empty in .env, so the app is still in dev-inbox mode.", "Fill in SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM (see .env.example), then run this again.");
}
if (!MAIL_FROM) {
  fail("MAIL_FROM is empty in .env.", 'Set it to something like:  MAIL_FROM="GradPonto <you@yourdomain>". For Gmail it must be your own Gmail address.');
}

const port = Number(SMTP_PORT || 587);
const secure = SMTP_SECURE ? SMTP_SECURE === "true" : port === 465;
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(SMTP_HOST);

console.log(`Connecting to ${SMTP_HOST}:${port} (${secure ? "TLS from the start" : "STARTTLS"})${SMTP_USER ? ` as ${SMTP_USER}` : " without a login"} ...`);

const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure,
  requireTLS: !secure && !isLocal,
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

try {
  await transport.verify();
  console.log("OK  Connected and logged in.");
  const info = await transport.sendMail({
    from: MAIL_FROM,
    to,
    subject: "GradPonto test email",
    text: "If you can read this, GradPonto can send email. Sign-in codes and welcome emails will now be delivered for real.",
  });
  console.log(`OK  Sent to ${to}. Server said: ${info.response}`);
  console.log("\nCheck the inbox (and the spam folder). Then restart the dev server so it picks up the .env change.");
} catch (error) {
  const text = String(error.response || error.message || error);
  console.error(`\nX Failed: ${text.split("\n")[0]}`);
  if (/535|auth|credentials|username and password/i.test(text)) {
    console.error("  The server rejected the login. Gmail needs an APP PASSWORD (not your normal password) and 2-step verification on. Check SMTP_USER and SMTP_PASS.");
  } else if (/ENOTFOUND|EAI_AGAIN/.test(text)) {
    console.error("  That host name doesn't exist. Check SMTP_HOST for typos.");
  } else if (/ETIMEDOUT|ECONNREFUSED|ESOCKET|timeout/i.test(text)) {
    console.error("  Couldn't reach the server. Check SMTP_HOST and SMTP_PORT, and that your network allows outgoing mail (ports 587 or 465 are sometimes blocked on office networks).");
  } else if (/TLS|SSL|STARTTLS|wrong version/i.test(text)) {
    console.error("  The TLS settings don't match the server. Port 465 needs SMTP_SECURE=true; port 587 should leave it blank.");
  } else if (/sender|from|not allowed|relay|550|553/i.test(text)) {
    console.error("  The server refused the sender. MAIL_FROM must be an address your provider lets you send from (for Gmail, your own Gmail address).");
  }
  process.exit(1);
}
