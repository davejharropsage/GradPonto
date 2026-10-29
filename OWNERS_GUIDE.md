# GradPonto: the owner's guide

This guide is for whoever runs GradPonto day to day, and doesn't assume any coding knowledge. The
[README](README.md) has the technical detail for developers.

## What GradPonto does

GradPonto is a website that helps students and graduates keep track of their job, internship and
placement applications. Signed-in users can:

- **Track applications**: a list and a board ("Pipeline") showing each application's stage, from
  *Interested* through *Applied*, *Online Assessment* and *Video Interview* to *Offer* or *Rejected*.
- **Find placements**: search live job listings (from Adzuna) and add them in one click.
- **Analyse a job**: paste a job advert and the AI pulls out the company, role, salary and deadline.
- **Check their CV** ("Application Reviewer"): the AI compares a CV with a job and suggests improvements.
- **Email import**: forward application emails (confirmations, test invites, interviews,
  rejections) to a private GradPonto address; the AI suggests updates, and the user approves them.
- Keep deadlines, goals, companies and documents (CVs, cover letters) in one place.

Admins (anyone whose email is in `ADMIN_EMAILS`) also get an **Admin** page: every account, how
much of the paid services has been used today, and an audit log of admin actions.

## What it runs on

GradPonto is made of a few online services. Nothing runs on your own computer.

| Service | What it does for GradPonto | Where to log in |
|---|---|---|
| **Vercel** | Hosts the website, and builds and publishes every change. Holds all the passwords and keys (as *environment variables*). | [vercel.com](https://vercel.com) → team *grad-ponto* → project *grad-ponto* |
| **GitHub** | Stores the code. A change goes live when it's merged into the `main` branch. | [github.com/davejharropsage/GradPonto](https://github.com/davejharropsage/GradPonto) |
| **Postgres database (Neon)** | Stores all the accounts and their data. Connected through Vercel. | Vercel → project → **Storage**, or [neon.tech](https://neon.tech) |
| **Anthropic Claude** | The AI behind Analyse a Job, the Application Reviewer and Email import. Pay as you go (about $0.03 per active user a month), with a monthly spend limit. | [console.anthropic.com](https://console.anthropic.com) |
| **Email provider (SMTP)** | Sends sign-up codes, password resets and welcome emails. | Whichever provider `SMTP_HOST` points at |
| **Postmark** | Receives the emails users forward to Email import. Charged per email received. | [postmarkapp.com](https://postmarkapp.com) |
| **Adzuna** | The job listings behind Find placements. Free, but limited to 250 searches a day. | [developer.adzuna.com](https://developer.adzuna.com) |
| **Sentry** (once set up) | Records crashes, on the server and in people's browsers, with the exact line of code. Personal details are stripped before anything is sent. | [sentry.io](https://sentry.io) (EU region) |
| **Wix** | Where the gradponto.com domain's DNS records are managed. | Wix → **Domains** |
| **Google / Microsoft** | The optional "Continue with Google/Microsoft" sign-in buttons. | Google Cloud Console / Microsoft Entra |

## How to run it

It runs by itself: there's nothing to start or keep switched on.

- **Making a change live:** merge the pull request into `main` on GitHub. Vercel builds and publishes
  it within a few minutes, and updates the database structure automatically if the change needs it.
- **Trying a change first:** every pull request gets its own *preview* website with a separate test
  database. Vercel posts the link on the pull request.
- **Changing a setting, key or password:** Vercel → project → **Settings → Environment Variables**.
  Edit the value, then **Deployments → ⋯ → Redeploy** the latest production deployment, because
  settings only take effect after a redeploy. `.env.example` in the code lists every setting and
  what it's for.
- **Running it on a computer** (developers only): see "Setup" in the [README](README.md).

## Spending limits

Every paid or limited service has a daily cap, so a bug, abuse or sudden popularity can't run up a
bill. When a cap is reached, people see a polite "try again tomorrow" message, you get an alert
email, and the count resets at midnight UTC. **Admin → Usage** shows today's numbers against each cap.

| Cap | Setting (Vercel environment variable) | Default |
|---|---|---|
| AI requests, whole site | `AI_DAILY_LIMIT` | 1000 a day |
| AI requests, per person | `AI_DAILY_LIMIT_PER_USER` | 100 a day (and 30 an hour) |
| Job searches | `ADZUNA_DAILY_LIMIT` | 200 a day (Adzuna's free limit is 250) |
| Emails sent | `MAIL_DAILY_LIMIT` | 250 a day |
| Emails received by Email import, whole site | `INBOUND_DAILY_LIMIT` | 1000 a day |
| Emails received by Email import, per person | `INBOUND_DAILY_LIMIT_PER_USER` | 150 a day |

To raise a cap, set the variable in Vercel and redeploy. Also check the provider's own billing
settings: the Claude Console (Billing) lets you set a monthly spend limit, which is a good second
safety net.

## When something breaks

### You'll usually hear about it first

**Crashes** go to **Sentry**, once it's set up (`NEXT_PUBLIC_SENTRY_DSN` in Vercel). Sentry emails you
about new problems and groups repeats, and each one shows the line of code, the page, and the browser.
Until Sentry is set up, crashes come as alert emails instead.

GradPonto also emails **alerts** to the address in `ALERT_EMAIL` (or, if that's empty, everyone in
`ADMIN_EMAILS`) when:

- the AI service stops working, or rejects the key;
- a daily spending cap is reached;
- the website hits an error it didn't expect (only while Sentry isn't set up).

You get at most one email an hour about the same problem, so a flood of errors doesn't flood your inbox.
Alerts are sent through the same email provider as sign-up codes, so **if email itself is broken,
alerts can't arrive either**. In that case people will say sign-up codes aren't arriving.

### Where to look

1. **Sentry → Issues** (once set up): every crash, newest first, with the code line and how often
   it has happened.
2. **Vercel → project → Logs.** Every error is written here with the words `[gradponto]` and a short
   description of where it happened. Filter by "Error" and search for the words from the alert.
3. **Admin → Usage** in GradPonto: has a cap been reached?
4. **Vercel → project → Deployments:** did the last deployment fail (red), or did problems start just
   after one?
5. **The provider's own dashboard or status page:** Anthropic, your email provider, Postmark, Neon.

### Common problems

| What people see | Likely cause | What to do |
|---|---|---|
| The whole site is down or every page errors | A bad deployment, or the database is unreachable | Vercel → **Deployments**, find the last one that worked → **⋯ → Instant Rollback**. That brings the old version straight back. Then check Neon's status page. |
| Sign-up or reset codes don't arrive | Email provider down, password changed, or the email cap reached | Check the alert or logs for "Could not send". Check your email provider's dashboard and `MAIL_DAILY_LIMIT` on Admin → Usage. Developers can test with `npm run mail:test`. |
| "The AI service rejected the request", or a "Claude requests are failing" alert | The Claude key is wrong or revoked, or the monthly spend limit is reached | Claude Console → **Billing** (raise the limit or add credit) and **API keys**. A new key goes in `ANTHROPIC_API_KEY` in Vercel, then redeploy. |
| "AI features have reached their limit for today" | `AI_DAILY_LIMIT` reached | Wait until tomorrow, or raise the cap if the use is genuine (see above). |
| "Search is very busy" / "limit for today" in Find placements | Adzuna's shared allowance is used up | Nothing to fix; it resets daily. |
| Email import shows nothing new | Forwarding isn't reaching Postmark, or Postmark can't reach the site | Postmark → **Activity**: no emails means check the Wix MX record (`in` → `inbound.postmarkapp.com`). Errors on the webhook mean check that `INBOUND_WEBHOOK_SECRET` in Vercel matches the password in Postmark's webhook URL. |
| Email import emails stuck "waiting" | The AI was busy or unavailable when they arrived | Nothing: GradPonto retries whenever the user opens the Email import page, and once a day at about 05:17 UTC (Vercel → project → **Settings → Cron Jobs** shows the schedule and its runs; Vercel's free plan allows no more than daily). If they stay stuck for hours, check the AI key (row above). |
| One person can't sign in | Their account is suspended or paused | Admin → find them → **Reinstate**. |

### If a password or key leaks

Change it at the provider first (for example, create a new Claude key in the Claude Console and delete the old one). Then
update the matching variable in Vercel and redeploy. If `AUTH_SECRET` leaks, change it: any sign-up
or reset codes and Google/Microsoft sign-ins in progress stop working (people just ask for a new
code), and nobody's data is affected. If a
user's Email import address leaks, they can press **Get a new address** on the Email import page.
