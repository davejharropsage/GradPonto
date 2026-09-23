// The content of GradPonto's two emails: the sign-in code and the welcome message.
//
// This file is deliberately PURE (no imports, no server code) so that two things can share it:
//   1. the app, which fills in real values and sends the result over SMTP
//      (see email-templates.ts), and
//   2. `npm run emails:export`, which fills in MailerSend-style {{ placeholders }} and writes
//      ready-to-paste HTML into ./emails, so the design MailerSend shows and the email users
//      really receive can never drift apart.
// Keep it to plain TypeScript syntax that Node can run directly (no enums, no path aliases).
//
// Email clients ignore stylesheets and web fonts, so everything is inline-styled tables with
// system fonts, in the GradPonto palette: ink #202128, ice #f5f7fb, teal #79c5cd, blue #476adb.

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// The text shown next to the subject in the inbox list, hidden in the email itself. The trailing
// non-breaking characters stop the client from pulling body text into the preview.
function preheader(text: string): string {
  return (
    `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#f5f7fb;">` +
    `${esc(text)}${"&zwnj;&nbsp;".repeat(40)}</div>`
  );
}

function page(opts: { title: string; preview: string; eyebrow: string; heading: string; body: string; footerNote: string }): string {
  return `<!doctype html>
<html lang="en-GB" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(opts.title)}</title>
<style>
  @media only screen and (max-width: 480px) {
    .gp-card { padding: 28px 20px !important; }
    .gp-code { font-size: 30px !important; letter-spacing: 6px !important; }
    .gp-h1 { font-size: 26px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f5f7fb;-webkit-text-size-adjust:100%;">
${preheader(opts.preview)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fb;">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">

      <tr><td style="padding:0 4px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="36" height="36" align="center" valign="middle" bgcolor="#202128" style="width:36px;height:36px;border-radius:10px;background:#202128;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:36px;font-weight:900;color:#79c5cd;">P</td>
          <td style="padding-left:10px;font-family:'Arial Narrow',Arial,Helvetica,sans-serif;font-size:26px;line-height:36px;font-weight:900;letter-spacing:-0.3px;color:#202128;">GradPonto</td>
        </tr></table>
      </td></tr>

      <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:20px;overflow:hidden;">
          <tr><td height="5" bgcolor="#79c5cd" style="height:5px;font-size:0;line-height:0;background:#79c5cd;background-image:linear-gradient(90deg,#86c159,#79c5cd,#5e84e2);">&nbsp;</td></tr>
          <tr><td class="gp-card" style="padding:36px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#202128;">
            <p style="margin:0 0 10px;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#476adb;">${esc(opts.eyebrow)}</p>
            <h1 class="gp-h1" style="margin:0 0 12px;font-family:'Arial Narrow',Arial,Helvetica,sans-serif;font-size:30px;line-height:1.15;font-weight:900;color:#202128;">${opts.heading}</h1>
${opts.body}
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:20px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#62646d;">
        ${opts.footerNote}<br>
        &copy; GradPonto. Find, apply and track UK placements, internships and apprenticeships.
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>
`;
}

/** The one-time sign-in code. */
export function loginCodeContent(v: { code: string; minutes: string | number }): EmailContent {
  const code = esc(String(v.code));
  const minutes = esc(String(v.minutes));

  return {
    subject: `Your GradPonto code: ${v.code}`,
    text:
      `Your GradPonto sign-in code is ${v.code}\n\n` +
      `Enter it on the sign-in page to continue. It expires in ${v.minutes} minutes and can only be used once.\n\n` +
      `If you didn't ask for this code you can safely ignore this email; nobody can sign in without it.\n`,
    html: page({
      title: "Your GradPonto code",
      preview: `Your sign-in code is ${v.code}. It expires in ${v.minutes} minutes.`,
      eyebrow: "Sign-in code",
      heading: "Your sign-in code",
      body: `            <p style="margin:0 0 24px;color:#62646d;">Enter this code on the GradPonto sign-in page to continue.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td class="gp-code" align="center" bgcolor="#f5f7fb" style="background:#f5f7fb;border-radius:14px;padding:22px 12px;font-family:Consolas,Menlo,'Courier New',monospace;font-size:38px;line-height:1.2;font-weight:700;letter-spacing:10px;color:#202128;">${code}</td>
            </tr></table>
            <p style="margin:20px 0 0;font-size:14px;color:#62646d;"><strong style="color:#202128;">Expires in ${minutes} minutes</strong> and can only be used once.</p>
            <p style="margin:18px 0 0;padding-top:18px;border-top:1px solid #e1e6ef;font-size:14px;color:#62646d;">Didn&#39;t ask for this? You can safely ignore this email. Nobody can sign in without this code, and we will never ask you for it.</p>`,
      footerNote: "You're receiving this because someone asked to sign in to GradPonto with this email address.",
    }),
  };
}

/** The signup email-verification code — proves they own the address before the account is usable. */
export function verifyEmailContent(v: { code: string; minutes: string | number }): EmailContent {
  const code = esc(String(v.code));
  const minutes = esc(String(v.minutes));

  return {
    subject: `Your GradPonto verification code: ${v.code}`,
    text:
      `Your GradPonto email verification code is ${v.code}\n\n` +
      `Enter it to finish creating your account. It expires in ${v.minutes} minutes and can only be used once.\n\n` +
      `If you didn't try to create a GradPonto account you can safely ignore this email.\n`,
    html: page({
      title: "Verify your email",
      preview: `Your verification code is ${v.code}. It expires in ${v.minutes} minutes.`,
      eyebrow: "Verify your email",
      heading: "Confirm it's you",
      body: `            <p style="margin:0 0 24px;color:#62646d;">Enter this code to finish creating your GradPonto account.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td class="gp-code" align="center" bgcolor="#f5f7fb" style="background:#f5f7fb;border-radius:14px;padding:22px 12px;font-family:Consolas,Menlo,'Courier New',monospace;font-size:38px;line-height:1.2;font-weight:700;letter-spacing:10px;color:#202128;">${code}</td>
            </tr></table>
            <p style="margin:20px 0 0;font-size:14px;color:#62646d;"><strong style="color:#202128;">Expires in ${minutes} minutes</strong> and can only be used once.</p>
            <p style="margin:18px 0 0;padding-top:18px;border-top:1px solid #e1e6ef;font-size:14px;color:#62646d;">Didn&#39;t try to create a GradPonto account? You can safely ignore this email &mdash; nobody can finish creating an account without this code.</p>`,
      footerNote: "You're receiving this because this email address was used to start creating a GradPonto account.",
    }),
  };
}

/** The password-reset code. */
export function resetPasswordContent(v: { code: string; minutes: string | number }): EmailContent {
  const code = esc(String(v.code));
  const minutes = esc(String(v.minutes));

  return {
    subject: `Your GradPonto password reset code: ${v.code}`,
    text:
      `Your GradPonto password reset code is ${v.code}\n\n` +
      `Enter it to set a new password. It expires in ${v.minutes} minutes and can only be used once.\n\n` +
      `If you didn't ask to reset your password you can safely ignore this email; your password won't change.\n`,
    html: page({
      title: "Reset your password",
      preview: `Your password reset code is ${v.code}. It expires in ${v.minutes} minutes.`,
      eyebrow: "Password reset",
      heading: "Reset your password",
      body: `            <p style="margin:0 0 24px;color:#62646d;">Enter this code on GradPonto to set a new password.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td class="gp-code" align="center" bgcolor="#f5f7fb" style="background:#f5f7fb;border-radius:14px;padding:22px 12px;font-family:Consolas,Menlo,'Courier New',monospace;font-size:38px;line-height:1.2;font-weight:700;letter-spacing:10px;color:#202128;">${code}</td>
            </tr></table>
            <p style="margin:20px 0 0;font-size:14px;color:#62646d;"><strong style="color:#202128;">Expires in ${minutes} minutes</strong> and can only be used once.</p>
            <p style="margin:18px 0 0;padding-top:18px;border-top:1px solid #e1e6ef;font-size:14px;color:#62646d;">Didn&#39;t ask to reset your password? You can safely ignore this email &mdash; your password won&#39;t change unless this code is used.</p>`,
      footerNote: "You're receiving this because a password reset was requested for this email address.",
    }),
  };
}

/** Sent once, when registration is completed, to confirm the account exists. */
export function welcomeContent(v: { name: string; university: string; email: string; appUrl: string }): EmailContent {
  const name = esc(v.name);
  const university = esc(v.university);
  const email = esc(v.email);
  const appUrl = esc(v.appUrl);

  // Rows share one rhythm: 18px at the top of the box, 18px at the bottom, 6px between rows.
  const row = (label: string, value: string, position: "first" | "middle" | "last") => {
    const pad = position === "first" ? "18px 20px 6px" : position === "last" ? "6px 20px 18px" : "6px 20px";
    return `<tr>
                <td width="38%" valign="top" style="padding:${pad};font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#62646d;">${label}</td>
                <td valign="top" style="padding:${pad};font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;font-weight:700;color:#202128;word-break:break-word;">${value}</td>
              </tr>`;
  };

  return {
    subject: `Welcome to GradPonto, ${v.name}: your account is ready`,
    text:
      `Hi ${v.name},\n\n` +
      `Your GradPonto account has been created.\n\n` +
      `  Name:        ${v.name}\n` +
      `  University:  ${v.university}\n` +
      `  Sign-in email: ${v.email}\n\n` +
      `How you sign in: go to ${v.appUrl}/signin and enter this email address and your password.\n\n` +
      `Open GradPonto: ${v.appUrl}/\n\n` +
      `If you didn't create this account, you can ignore this email.\n`,
    html: page({
      title: "Welcome to GradPonto",
      preview: `Your account is ready, ${v.name}.`,
      eyebrow: "Account created",
      heading: `Welcome, ${name}`,
      body: `            <p style="margin:0 0 22px;color:#62646d;">Your GradPonto account is ready. Here&#39;s what we have on file:</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fb;border-radius:14px;">
              ${row("Name", name, "first")}
              ${row("University", university, "middle")}
              ${row("Sign-in email", email, "last")}
            </table>
            <p style="margin:26px 0 6px;font-weight:700;">How you sign in</p>
            <p style="margin:0 0 26px;color:#62646d;">Enter your email address and your password on the sign-in page.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td bgcolor="#202128" style="border-radius:10px;background:#202128;"><a href="${appUrl}/" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Open GradPonto</a></td>
            </tr></table>
            <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #e1e6ef;font-size:14px;color:#62646d;">Didn&#39;t create this account? You can ignore this email.</p>`,
      footerNote: "You're receiving this because this email address was used to create a GradPonto account.",
    }),
  };
}
