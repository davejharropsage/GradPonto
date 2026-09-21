import "server-only";
import { AUTH, appUrl } from "./config";
import type { Mail } from "./mailer";

// Inline styles only: email clients ignore stylesheets and web fonts, so these use
// system fonts and the GradPonto palette (ink #202128, ice #f5f7fb, teal #79c5cd).

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f5f7fb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 4px 20px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:900;color:#202128;letter-spacing:-0.3px;">GradPonto</td></tr>
        <tr><td style="background:#ffffff;border-radius:20px;padding:36px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#202128;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#62646d;">
          You're receiving this because this address was used on GradPonto. If that wasn't you, you can ignore this email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** The one-time sign-in code. */
export function loginCodeEmail(to: string, code: string): Mail {
  const minutes = AUTH.codeTtlMinutes;
  return {
    to,
    subject: `Your GradPonto code: ${code}`,
    text:
      `Your GradPonto sign-in code is ${code}\n\n` +
      `Enter it on the sign-in page to continue. It expires in ${minutes} minutes and can only be used once.\n\n` +
      `If you didn't ask for this code you can safely ignore this email; nobody can sign in without it.\n`,
    html: layout(
      "Your GradPonto code",
      `<h1 style="margin:0 0 8px;font-size:24px;line-height:1.2;">Your sign-in code</h1>
       <p style="margin:0 0 24px;color:#62646d;">Enter this code on the GradPonto sign-in page to continue.</p>
       <div style="background:#f5f7fb;border-radius:14px;padding:20px;text-align:center;font-family:Consolas,Menlo,monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#202128;">${esc(code)}</div>
       <p style="margin:24px 0 0;color:#62646d;font-size:14px;">It expires in ${minutes} minutes and can only be used once. If you didn't ask for it, you can safely ignore this email; nobody can sign in without it.</p>`
    ),
  };
}

/** Sent once, when registration is completed, to confirm the account exists. */
export function welcomeEmail(user: { email: string; name: string; university: string }): Mail {
  const url = `${appUrl()}/`;
  return {
    to: user.email,
    subject: `Welcome to GradPonto, ${user.name}: your account is ready`,
    text:
      `Hi ${user.name},\n\n` +
      `Your GradPonto account has been created.\n\n` +
      `  Name:        ${user.name}\n` +
      `  University:  ${user.university}\n` +
      `  Sign-in email: ${user.email}\n\n` +
      `How you sign in: there is no password. Go to ${appUrl()}/signin, enter this email address, ` +
      `and we'll send you a one-time code.\n\n` +
      `Open GradPonto: ${url}\n\n` +
      `If you didn't create this account, you can ignore this email; nobody can sign in without a code sent to this address.\n`,
    html: layout(
      "Welcome to GradPonto",
      `<h1 style="margin:0 0 8px;font-size:24px;line-height:1.2;">Welcome, ${esc(user.name)}</h1>
       <p style="margin:0 0 24px;color:#62646d;">Your GradPonto account has been created.</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f5f7fb;border-radius:14px;">
         <tr><td style="padding:16px 20px;font-size:14px;color:#62646d;width:38%;">Name</td><td style="padding:16px 20px 0;font-weight:700;">${esc(user.name)}</td></tr>
         <tr><td style="padding:8px 20px;font-size:14px;color:#62646d;">University</td><td style="padding:8px 20px;font-weight:700;">${esc(user.university)}</td></tr>
         <tr><td style="padding:0 20px 16px;font-size:14px;color:#62646d;">Sign-in email</td><td style="padding:0 20px 16px;font-weight:700;">${esc(user.email)}</td></tr>
       </table>
       <p style="margin:24px 0 8px;font-weight:700;">How you sign in</p>
       <p style="margin:0 0 24px;color:#62646d;">There is no password to remember. Enter this email address on the sign-in page and we'll email you a one-time code.</p>
       <a href="${esc(url)}" style="display:inline-block;background:#202128;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:10px;">Open GradPonto</a>
       <p style="margin:28px 0 0;color:#62646d;font-size:14px;">If you didn't create this account, you can ignore this email; nobody can sign in without a code sent to this address.</p>`
    ),
  };
}
