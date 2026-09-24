# GradPonto

A web app for UK graduates to track placement / graduate job applications: log opportunities, tailor a CV and cover letter per job (optionally with AI help), export a finished PDF, and track each application's status from first interest through to an offer, on a dashboard, a card grid, or a drag-and-drop kanban pipeline.

People sign in with their email (a one-time code, no password), register with their name and university, and only ever see their own data. See [Accounts & sign-in](#accounts--sign-in).

The public marketing page is at `/landing` and its **Get started free** button leads to sign-in.

## Technology stack

- **Framework:** Next.js (App Router) + TypeScript, single app for both frontend and backend
- **Database:** SQLite, a single file at `prisma/dev.db`
- **ORM:** Prisma 6 (pinned to `6.19.3`, classic engine — see [ARCHITECTURE.md](ARCHITECTURE.md) for why)
- **Styling:** Tailwind CSS v4, dark mode via `next-themes`
- **UI components:** shadcn/ui (built on `@base-ui/react`)
- **AI:** Google Gemini (free key from AI Studio) via plain `fetch`; `@anthropic-ai/sdk` kept as an optional fallback. The app works fully without a key, with the AI features simply disabled
- **PDF export:** `@react-pdf/renderer`
- **Package manager:** npm

## Project structure

```
prisma/
  schema.prisma          The data model — User, Session, LoginCode, plus Employer, Application, Document, Activity, Goal (each owned by a User)
  migrations/             Auto-generated SQL migrations
  dev.db                  The SQLite database file (gitignored — it's your real data)
src/
  app/
    layout.tsx             Minimal root layout — theme provider + toast host only
    landing/                Public marketing page (GradPonto landing page)
    signin/, welcome/       Sign-in (email + code) and registration (name + university)
    dev/outbox/             Development-only inbox for emails when SMTP isn't configured
    (app)/                  Route group for every page that gets the sidebar shell
      layout.tsx              Wraps children in <AppShell>
      page.tsx                 Dashboard
      applications/            List (card grid), create, edit, detail + per-application document editor
      pipeline/                 Kanban board, drag-and-drop between statuses
      deadlines/                 Grouped: overdue / due within 30 days / later
      analyse-job/                Paste a job posting (or a URL) → AI-extracted fields → pre-filled application
      check-cv/                    Application Reviewer — tabbed CV/cover-letter tools, mode kept in ?mode=
      employers/                    List, create, edit, detail ("Companies" in the sidebar)
      documents/                     Manage named CV and cover-letter versions (upload a file or paste text)
      account/                        Local profile name + Free/Pro plan toggle
    api/documents/[id]/pdf       Route handler that renders a Document to a downloadable PDF
  components/
    ui/                    Generated shadcn/ui primitives — do not hand-edit, re-run the CLI instead
    layout/                Sidebar + header shell, theme toggle, search
    landing/               Landing-page sections and the header with the Get started free button
    auth/                  Sign-in, code and registration forms
    brand/                 GradPonto mark and wordmark
    dashboard/, applications/, pipeline/, documents/, analyse-job/, check-cv/, employers/, activities/
                            Feature-specific components
    shared/                Small reusable pieces (PageHeader, EmptyState, Pagination, DeleteButton, LinkButton)
  lib/
    db.ts                  Prisma client singleton
    validations.ts          zod schemas for every form
    labels.ts                Enum → human label / colour maps, shared between server and client
    ai/                      client.ts (generateText: Gemini, or Claude as fallback; JSON helper), limit.ts (per-user hourly allowance), tailor.ts, analyze-job.ts, match-cv.ts
    pdf/render.ts             React-PDF template + render-to-buffer helper
    data/                    Read-only query functions, one file per entity
    actions/                 `"use server"` mutations, one file per entity
```

Every page follows the same shape: a server component in `app/` calls a function from `lib/data/*`, passes the result to components in `components/`, and forms call a `"use server"` function from `lib/actions/*`. There's no separate REST API layer for CRUD — Next.js Server Actions handle mutations directly. The two exceptions are the PDF export (needs to stream a binary file with `Content-Disposition: attachment`) and the Pipeline board's drag-and-drop (a client component calling a server action directly, with optimistic local state — see [ARCHITECTURE.md](ARCHITECTURE.md)).

## Running the app

Start the dev server:

```bash
npm run dev
```

Then open **http://localhost:3000** for the app, or **http://localhost:3000/landing** for the marketing page.

To stop it, press `Ctrl+C` in the terminal it's running in (or close the terminal).

For a production-style run:

```bash
npm run build
npm run start
```

## The database

The database is a single SQLite file at `prisma/dev.db`. It is **not** committed to git (see `.gitignore`) — it holds your real CV content, job descriptions, and application history, which is personal data you don't want in version control or a shared repo.

### Running migrations

Whenever you (or an AI assistant) change `prisma/schema.prisma`, apply the change with:

```bash
npx prisma migrate dev --name <short-description>
```

This updates `dev.db` in place and writes a new folder under `prisma/migrations/`. Commit the migration folder — that's the part of the schema history that *should* be in git.

### Resetting the database

To wipe all data and start over:

```bash
npx prisma migrate reset
```

This drops and recreates `dev.db` from the migrations, then reruns any seed script (none exists yet).

### Inspecting the database

```bash
npx prisma studio
```

Opens a local GUI at `http://localhost:5555` for browsing and editing rows directly — handy for debugging.

## AI features

Three features use AI, and all three are entirely optional — each degrades gracefully (buttons disable themselves, with a note pointing at this section) if no key is configured:

- **Generate with AI** (on a document, in an application) — drafts a tailored CV or cover letter from your base document plus the job description.
- **Analyse a Job** — paste a job posting (or a URL, via "Auto-fill", which does a plain server-side fetch-and-strip-HTML first) and the AI extracts title, company, location, salary, and deadline, which pre-fill a new application.
- **Application Reviewer** (`/check-cv`, formerly "Check My CV") — a tabbed page for CV/cover-letter tools. Today it has one working tab, **Job Match**, which compares a saved CV against a specific application's job description and returns a match score, strengths, gaps, and concrete suggestions. Health Check, ATS Keywords, and Cover Letter are reserved tabs, shown as "coming soon" until they ship.

They use Google's Gemini API. To enable them:

1. Create a free key in Google AI Studio: <https://aistudio.google.com/apikey> ([guide](https://aistudio.google.com/docs/get-started)).
2. Add it to `.env` (which is git-ignored — never commit a key):
   ```
   GEMINI_API_KEY=...
   ```
3. Restart the dev server.

The model defaults to `gemini-3.8-flash`; set `GEMINI_MODEL` to change it. If `GEMINI_API_KEY` is empty but `ANTHROPIC_API_KEY` is set, Claude is used instead. The free tier has a small shared allowance, so each person is limited to 30 AI requests an hour (`src/lib/ai/limit.ts`), and a friendly message is shown if Google's limit is reached.

AI-generated document content is always labeled with an "AI drafted" badge so you remember to review it before using it.

## Find placements (Adzuna job search)

**Find placements** (top of the Track group in the left menu) searches live UK adverts through the [Adzuna API](https://developer.adzuna.com/) and lets you add any result to your pipeline with one click ("Add to pipeline" creates an *Interested* application with the link, location, salary and a summary; adverts already added show "In your pipeline").

Setup: register at <https://developer.adzuna.com/> and add to `.env`:

```
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
```

How it behaves (ported from the original Python search harness):

- One request per search: all your keywords go to Adzuna as `what_or`, then results are de-duplicated and ranked. Student-friendly roles (placements, internships, graduate schemes) are boosted, staff roles ("Placement Officer", "Head of…") are pushed down, and fee-charging "training courses" are hidden behind a visible "Show it" link.
- Adzuna's free quota is shared by everyone using the app (25/min, 250/day). Results are cached for 15 minutes, each user gets 12 fresh searches an hour, and there is a global per-minute/day budget. Cached searches keep working when a limit is hit.
- Adzuna's terms require a "Jobs by Adzuna" credit on every advert. Save Adzuna's official logo as `public/adzuna-logo.svg` (or `.png`) and it is used automatically; otherwise a linked text credit is shown. Adzuna's *predicted* salaries are never displayed (they need a separate credit).
- The API key stays on the server and is never included in pages or error messages.

Pure logic lives in `src/lib/jobs/listing.ts` and is covered by `npm test`.

## Pipeline: drag and drop

On **Pipeline**, pick a card up and drop it in another column to change its status (the change is saved, logged in the application's timeline, and shown immediately; if saving fails it jumps back and you are told). Mouse: drag. Touch: press and hold, then drag. Keyboard: focus a card, Space to pick up, Left/Right arrows to change column, Space to drop, Escape to cancel. A plain click on the company name still opens the application.

## Accounts & sign-in

Two ways in, both on `/signin` and `/signup`:

- **Email and password.** `/signup` takes an email and password, emails a 6-digit code (valid 10 minutes, single use) and the account is verified once the code is entered on `/signup/verify`. After that, `/signin` is just email and password. `/forgot-password` resets it with another emailed code.
- **Continue with Google / Microsoft.** The first time a Google or Microsoft account is used, a 6-digit code is emailed to the address it reported and entered on the same `/signup/verify` page. That creates the account (or, if the email already has one, links to it). Every later sign-in with that Google/Microsoft account goes straight in with no code. Apple is shown as "Soon" (it needs a paid Apple Developer membership).

Either way, a new account then goes to `/welcome` for **name and university**, which completes registration and sends a confirmation email.

### Setup

Copy `.env.example` to `.env` and set at least `DATABASE_URL` (a Postgres connection string), `AUTH_SECRET` (random, 32+ characters; the file explains how to generate one) and `APP_URL`.

### Continue with Google / Microsoft

Each button stays greyed out until both of its keys are set. The code is in `src/lib/auth/oauth.ts`, `src/lib/auth/oauth-core.ts` and `src/app/api/auth/oauth/[provider]/`. Linked accounts are stored in the `OAuthAccount` table.

Each provider needs a **redirect URI** registered: `APP_URL` + `/api/auth/oauth/<provider>/callback`. Register both the local and the live one:

- `http://localhost:3000/api/auth/oauth/google/callback` and `https://grad-ponto.vercel.app/api/auth/oauth/google/callback`
- the same two with `microsoft` in place of `google`

Vercel preview deployments use the live `APP_URL`, so provider sign-in on a preview URL sends you back to the live site. Test it locally or on production.

**Google** ([Google Cloud Console](https://console.cloud.google.com/)):
1. Create a project, then **APIs & Services → OAuth consent screen**: user type *External*, app name *GradPonto*, support email, and the scopes `openid`, `email` and `profile`. While it's in *Testing* mode only the test users you list can sign in; **Publish app** to open it to everyone. The basic scopes don't need Google's review.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**, type *Web application*. Add both redirect URIs above.
3. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

**Microsoft** ([Microsoft Entra admin center](https://entra.microsoft.com/) → **App registrations → New registration**):
1. Supported account types: *Accounts in any organizational directory and personal Microsoft accounts*. Redirect URI: platform *Web*, with the localhost URI. Add the live one afterwards under **Authentication**.
2. Copy the *Application (client) ID* into `MICROSOFT_CLIENT_ID`.
3. **Certificates & secrets → New client secret**, then copy its **Value** (not the Secret ID) into `MICROSOFT_CLIENT_SECRET`. Secrets expire (the maximum is 2 years), so note the date.

For the live site, add the same four variables in Vercel (**Settings → Environment Variables**) and redeploy.

### Email

- **Development (no `SMTP_HOST`)**: emails are not sent. They are saved in `.mail-outbox/` and listed at <http://localhost:3000/dev/outbox>, which is where you read your sign-in code. That page returns 404 in production.
- **Production**: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM`. Without SMTP configured in production, sign-in fails loudly rather than pretending to send.
- **Check it works**: after filling in the SMTP settings run `npm run mail:test -- you@example.com`. It connects, logs in and sends one real email, and explains the likely cause if anything is wrong. Restart the dev server afterwards so it picks up `.env`. `.env.example` has a quick Gmail recipe for testing.

### How data is kept private

Every user-owned table has a `userId`. Application code never uses the raw Prisma client; it gets a client from `userDb()` (`src/lib/auth/user.ts`) that adds `userId` to every query and stamps it on every insert. `src/lib/db.ts` exports the raw client as `prisma` on purpose so any unscoped use is obvious (and `import { db }` no longer compiles). Server actions and route handlers each re-check the session themselves; `src/proxy.ts` only does a quick cookie check and is not the security boundary. Where an action accepts an id that links two records (for example an activity's `applicationId`), it first checks that the id belongs to the signed-in user.

### Before going live

- Set a production `AUTH_SECRET` and a real SMTP provider, and serve over https (`APP_URL=https://...`, which also marks cookies `Secure`).
- The per-IP flood limiter in `src/lib/auth/rate-limit.ts` is in-memory and per server process; use a shared store (for example Redis) if you run more than one instance.
- Review and complete the Privacy Policy and Terms (they are drafts with `[bracketed]` placeholders).
- There is no self-service account deletion yet.
- Existing databases from the single-user version can't be upgraded in place: the migration adds a required owner to every row. Start from an empty database, or write a one-off script that creates a `User` and assigns the old rows to it.

## Adding future features

The codebase is intentionally light on abstraction so it stays easy to extend:

- **New entity (e.g. "Contact" for a recruiter):** add a model to `schema.prisma`, run a migration, then copy the shape of `lib/data/employers.ts` + `lib/actions/employers.ts` + `components/employers/*` + `app/(app)/employers/*` — every entity in this app follows that same four-piece pattern.
- **New field on an existing entity:** add it to the model in `schema.prisma`, migrate, then add it to the relevant zod schema in `lib/validations.ts`, the form component, and the detail page.
- **Email/calendar integration (posting applications, watching for replies):** deliberately deferred. The `Application.appliedAt` field and the `Activity` timeline (with a `STATUS_CHANGE` type already auto-logged) exist so a future integration has a natural place to read from and write to. The cleanest path is a local MCP server for email/calendar — see the note below.

## Local MCP servers (future)

This app doesn't talk to email or calendars yet — that was explicitly scoped out of v1. When you're ready to add it, the natural shape is a local MCP server (or a small dedicated script) that:

- reads `Application` rows with `status = APPLIED` and a recent `appliedAt`,
- watches the mailbox for replies referencing those applications,
- calls the existing `updateApplicationStatus` server action (or writes to the DB directly) to advance `status` and logs an `Activity` with type `STATUS_CHANGE` or `NOTE`.

Nothing in the current schema needs to change to support this — it's additive.

## Migrating to PostgreSQL later

If this ever needs multi-device or networked access beyond a single machine:

1. Stand up a Postgres instance (Docker is easiest: `docker run -e POSTGRES_PASSWORD=... -p 5432:5432 postgres`).
2. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Update `DATABASE_URL` in `.env` to a Postgres connection string.
4. Run `npx prisma migrate dev` to recreate the schema on the new database (this does **not** copy existing SQLite data — export/import data separately if needed, e.g. via `prisma db seed` or a one-off script).

No application code needs to change — all database access goes through Prisma, which abstracts the SQL dialect differences.

## Local network access (future)

Accounts and per-user data are in place (see [Accounts & sign-in](#accounts--sign-in)), but review [Before going live](#before-going-live) first. Then:

1. Set the production environment variables.
2. Run `npm run build && npm run start` (Next.js listens on all interfaces by default with `next start`, or bind explicitly with `next start -H 0.0.0.0`).
3. Access it from another device on the same network via `http://<your-machine-ip>:3000`.

## Real subscriptions / billing (future)

The `/account` page's Free/Pro toggle is a simulation: no payment processor is connected and nothing is charged. To make this a real subscription:

1. Add a payment provider (Stripe is the standard choice) — this needs real API keys and, since this app has no server that's reachable from the internet, either a hosted deployment or a webhook-relay tool (e.g. the Stripe CLI's `listen --forward-to`) for local development.
2. Subscriptions attach to the signed-in `User` (`User.plan`).
3. Replace `setPlan` in `lib/actions/profile.ts` with a call into the payment provider's checkout flow, and update `User.plan` from its webhook events rather than directly from a button click.
