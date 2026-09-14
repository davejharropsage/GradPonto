# PlacementPilot

A locally hosted, self-contained tool for tracking university placement / graduate job applications: log opportunities, tailor a CV and cover letter per job (optionally with AI help), export a finished PDF, and track each application's status from first interest through to an offer — on a dashboard, a card grid, or a drag-and-drop kanban pipeline.

Runs entirely on your own machine. No account, no cloud database, and no internet connection required after the initial `npm install` — except for the optional AI features (job analysis, CV matching, document tailoring), which call the Anthropic API.

There's also a separate public-style **landing page** at `/landing` (Monday.com-style marketing page) with a sign-up form for a Free/Pro plan choice — see [AI features & sign-up](#ai-features--sign-up) below for what that actually does locally.

## Technology stack

- **Framework:** Next.js (App Router) + TypeScript, single app for both frontend and backend
- **Database:** SQLite, a single file at `prisma/dev.db`
- **ORM:** Prisma 6 (pinned to `6.19.3`, classic engine — see [ARCHITECTURE.md](ARCHITECTURE.md) for why)
- **Styling:** Tailwind CSS v4, dark mode via `next-themes`
- **UI components:** shadcn/ui (built on `@base-ui/react`)
- **AI:** `@anthropic-ai/sdk`, optional — the app works fully without an API key, with features simply disabled
- **PDF export:** `@react-pdf/renderer`
- **Package manager:** npm

## Project structure

```
prisma/
  schema.prisma          The data model — Employer, Application, Document, Activity, Profile, Signup
  migrations/             Auto-generated SQL migrations
  dev.db                  The SQLite database file (gitignored — it's your real data)
src/
  app/
    layout.tsx             Minimal root layout — theme provider + toast host only
    landing/                Public marketing page (no sidebar) with the sign-up form
    (app)/                  Route group for every page that gets the sidebar shell
      layout.tsx              Wraps children in <AppShell>
      page.tsx                 Dashboard
      applications/            List (card grid), create, edit, detail + per-application document editor
      pipeline/                 Kanban board, drag-and-drop between statuses
      deadlines/                 Grouped: overdue / due within 30 days / later
      analyse-job/                Paste a job posting (or a URL) → AI-extracted fields → pre-filled application
      check-cv/                    Match a saved CV against a specific application's job description
      employers/                    List, create, edit, detail ("Companies" in the sidebar)
      documents/                     Manage your base CV and base cover letter
      account/                        Local profile name + Free/Pro plan toggle
    api/documents/[id]/pdf       Route handler that renders a Document to a downloadable PDF
  components/
    ui/                    Generated shadcn/ui primitives — do not hand-edit, re-run the CLI instead
    layout/                Sidebar + header shell, theme toggle, search
    landing/               Landing-page-only sections (hero, features, pricing, signup)
    dashboard/, applications/, pipeline/, documents/, analyse-job/, check-cv/, employers/, activities/
                            Feature-specific components
    shared/                Small reusable pieces (PageHeader, EmptyState, Pagination, DeleteButton, LinkButton)
  lib/
    db.ts                  Prisma client singleton
    validations.ts          zod schemas for every form
    labels.ts                Enum → human label / colour maps, shared between server and client
    ai/                      client.ts (shared Anthropic client + JSON helper), tailor.ts, analyze-job.ts, match-cv.ts
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

## AI features & sign-up

Three features call Claude, and all three are entirely optional — each degrades gracefully (buttons disable themselves, with a note pointing at this section) if no key is configured:

- **Generate with AI** (on a document, in an application) — drafts a tailored CV or cover letter from your base document plus the job description.
- **Analyse a Job** — paste a job posting (or a URL, via "Auto-fill", which does a plain server-side fetch-and-strip-HTML first) and Claude extracts title, company, location, salary, and deadline, which pre-fill a new application.
- **Check My CV** — compares a saved CV against a specific application's job description and returns a match score, strengths, gaps, and concrete suggestions.

To enable them:

1. Get an API key at <https://console.anthropic.com/settings/keys>.
2. Add it to `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the dev server.

AI-generated document content is always labeled with an "AI drafted" badge so you remember to review it before using it.

**The `/landing` sign-up form** does *not* call AI or process any payment — it's a local-only sign-up capture (writes a `Signup` row and updates your local `Profile.plan`) that mirrors what a real Free/Pro subscription flow would look like. See [ARCHITECTURE.md](ARCHITECTURE.md) for what wiring up real billing would actually need.

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

Not configured yet, and **do not expose this to your network as-is** — there's no authentication, so anyone on the network could read your CVs and application history. Before doing that:

1. Add authentication (e.g. a simple password gate via middleware, or a proper auth library if this grows beyond single-user).
2. Run `npm run build && npm run start` (Next.js listens on all interfaces by default with `next start`, or bind explicitly with `next start -H 0.0.0.0`).
3. Access it from another device on the same network via `http://<your-machine-ip>:3000`.

## Real subscriptions / billing (future)

The `/account` page's Free/Pro toggle and the landing page's sign-up form are both local-only simulations — no payment processor is connected, and nothing is charged. To make this a real subscription:

1. Add a payment provider (Stripe is the standard choice) — this needs real API keys and, since this app has no server that's reachable from the internet, either a hosted deployment or a webhook-relay tool (e.g. the Stripe CLI's `listen --forward-to`) for local development.
2. Add real authentication (see "Local network access" above) — a subscription needs to be tied to a real signed-in user, not the single local `Profile` row this app currently has.
3. Replace `setPlan`/`createSignup` in `lib/actions/profile.ts` / `lib/actions/signup.ts` with calls into the payment provider's checkout flow, and update `Profile.plan` from its webhook events rather than directly from a button click.
