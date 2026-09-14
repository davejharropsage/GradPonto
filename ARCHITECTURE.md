# Architecture Decisions

## Why Next.js App Router for both frontend and backend

One process, one deployment unit, one language. Server Components fetch data directly from Prisma with no separate API layer to maintain; Server Actions handle mutations the same way. For a single-user local app, a decoupled REST/GraphQL API would be pure overhead.

## Why Prisma, and why pinned to `6.19.3` on the classic engine

Prisma's schema file is a single, readable source of truth for the data model, and `prisma migrate dev` gives a clear, inspectable migration history — both valuable for a codebase meant to be read and modified by an AI assistant over time.

The pinning matters: `prisma init` on both Prisma 6.19 and 7/8 now defaults to the newer `"prisma-client"` generator (ESM output, ostensibly for driver-adapter support). That generator computes its SQLite file path from `import.meta.url` at the generated client's own location. That assumption breaks under Turbopack/webpack bundling — bundled code no longer lives where it was generated, so `import.meta.url` resolves relative paths incorrectly and Prisma fails with "unable to open the database file" the moment you use a relative `file:./dev.db` URL inside a Next.js app.

The fix used here: `DATABASE_URL` in `.env` is an **absolute** path (`file:C:/Users/.../prisma/dev.db`) rather than a relative one, which sidesteps the broken relative resolution entirely. If you move the project to a different machine or path, update `DATABASE_URL` accordingly (this is also why `.env` is gitignored and `.env.example` ships with a relative placeholder as a reminder).

If this bites again in a future Prisma release, the alternative is switching the generator back to the classic `"prisma-client-js"` provider, which resolves paths via plain `require`/`__dirname` semantics that bundlers handle correctly — that generator is deprecated but still functional as of Prisma 6.

## Why SQLite

Zero setup — no server process to install, configure, or keep running. The entire database is one file, trivially backed up by copying it. Prisma's datasource abstraction means switching to Postgres later (see README) is a schema-provider change plus a fresh migration, not a rewrite.

## Why Server Actions instead of a REST API

Every mutation (`createApplication`, `updateEmployer`, `deleteDocument`, etc.) is a `"use server"` function called directly from a form's `action` prop or from a client component. This removes an entire layer (route handlers, fetch calls, response parsing, client-side error mapping) that would otherwise exist purely to shuttle data between a frontend and a backend running in the same process. The one exception is `app/api/documents/[id]/pdf/route.ts`, which exists only because streaming a binary file with a `Content-Disposition` header isn't something a Server Action can do — Server Actions are for JSON-serializable request/response cycles, not file downloads.

## Why `@react-pdf/renderer` over Puppeteer or `pdf-lib`

- **Puppeteer** requires a bundled or system Chromium — extra disk space, slower cold starts, and more moving parts to keep working across OS updates on a machine you're not deploying to a container.
- **`pdf-lib`** builds PDFs from low-level drawing primitives (text runs, coordinates) — accurate but verbose for anything beyond a trivial layout.
- **`@react-pdf/renderer`** lets the CV/cover-letter template be written as JSX with a StyleSheet API, similar enough to regular React that it doesn't need separate mental overhead, and it's pure JavaScript with no native binary dependency.

## Why shadcn/ui on `@base-ui/react` instead of Radix

This is simply what the `shadcn` CLI installed by default at the time this project was scaffolded — Base UI is Radix's successor within the shadcn ecosystem. The practical difference that matters for future edits: Base UI has **no `asChild` prop**. Where you'd write `<Button asChild><Link>...</Link></Button>` in a Radix-based shadcn project, this codebase either:

- uses the `render` prop for non-link triggers (e.g. `<DialogTrigger render={<Button>...</Button>} />`), or
- for links specifically (Base UI's own docs advise against rendering an `<a>` through a `Button`'s `render` prop, since links and buttons have different semantics), uses the small `LinkButton` helper in `src/components/shared/link-button.tsx`, which applies `buttonVariants()` classes directly to a `next/link` `<Link>`.

If you add a new "link that looks like a button," reach for `LinkButton`, not `<Button asChild>`.

## Why `Select` components pass an explicit label-lookup function

Base UI's `Select.Value` only knows an option's display label once its `Select.Item` list has actually rendered and registered — it will *not* automatically show the correct label for a value set only via `defaultValue`/`value`, and instead falls back to printing the raw value string (e.g. `SAVED` instead of `Saved`). Base UI's own examples solve this with an `items` prop on `Select.Root`; this codebase instead passes a `children` render function to `Select.Value` (e.g. `<SelectValue>{(value) => applicationStatusLabels[value] ?? value}</SelectValue>`), since the label maps in `lib/labels.ts` already exist and this avoids constructing a parallel `items` array at every call site. Because `Select.Value`'s `children` must be a function, any form component that uses it has to be a Client Component (`"use client"`) — functions aren't serializable across the Server/Client Component boundary.

## Why every page forces dynamic rendering

`export const dynamic = "force-dynamic"` in `src/app/layout.tsx` applies to the whole app. Without it, Next.js tries to statically prerender pages with no dynamic data dependency at *build* time, which runs Prisma queries during `next build` — before you'd necessarily want the build machine touching the real `dev.db`, and fragile in exactly the way described above (bundled build-time code resolving paths differently than runtime code). Since this is a single-user local app where every page reflects live database state, there's no benefit to static generation here.

## Why no authentication in v1

This is a single-user, localhost-only tool. Authentication adds meaningful complexity (session handling, password storage, route guarding) for zero benefit while the app never listens on anything but `localhost`. It becomes necessary the moment this is exposed to a LAN or the internet — see the README's "Local network access" section, which flags this explicitly as a prerequisite, not an afterthought.

## Why AI tailoring and PDF export are isolated in `lib/ai/` and `lib/pdf/`

Both are optional, single-purpose capabilities with an external dependency (an API key; a rendering library). Keeping them in their own files with a narrow function signature (`tailorDocument(...)`, `renderDocumentToPdf(...)`) means either could be swapped for a different provider or library later by touching one file, not scattered call sites.

## Why `(app)` is a route group, and `/landing` sits outside it

The public landing page needed to render without the sidebar/header chrome, while every other page needed it. Rather than adding a conditional inside one shared layout (which would need to know about every current and future route), the sidebar shell moved into `src/app/(app)/layout.tsx` — a [route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups), which organizes routes without adding a `/app` segment to the URL. `src/app/layout.tsx` (the real root layout) now only sets up fonts, the theme provider, and the toast host; `src/app/landing/page.tsx` is a sibling of `(app)`, so it inherits the root layout but not the sidebar. Moving a page in or out of the sidebar shell going forward is just moving its folder in or out of `(app)/`.

## Why the company field became free text instead of a picker

Earlier, `Application` had an `employerId` foreign key filled from a `<Select>` of existing employers, which meant creating a new employer was a separate trip to `/employers/new` before you could even log an application. The reference design treats "company" as a plain field on the application card, so `lib/actions/applications.ts` now has `upsertEmployerId(name)`: it looks up an `Employer` by exact name and creates one if none exists, called from both `createApplication` and `updateApplication`. The form itself is a plain text `<Input>` with a `<datalist>` of existing employer names for autocomplete — no client-side JS needed for that part. The `Employer` model and its own CRUD pages are unchanged and still useful (deduping, and a place to hang future employer-level notes/industry data); they're just no longer in the critical path of logging an application.

## Why the Pipeline board uses native HTML5 drag-and-drop instead of a library

`react-dnd` or `@dnd-kit` would add a real dependency for something the platform already does: `draggable`, `onDragStart`, `onDragOver`, `onDrop` are enough for a single-column-to-column kanban move with no reordering-within-a-column requirement. `PipelineBoard` (`src/components/pipeline/pipeline-board.tsx`) keeps its own optimistic `useState` copy of the grouped applications, updates it synchronously on drop for instant visual feedback, then calls the `updateApplicationStatus` server action in a transition and `router.refresh()` afterward to reconcile with the database (which also picks up the auto-logged `STATUS_CHANGE` activity). If this ever needs touch-screen support or reordering within a column, that's the point to reach for a real library — the current approach doesn't support touch drag.

## Why "Analyse a Job" fetches URLs with a regex strip instead of a readability library

Pulling the visible text out of an arbitrary job-posting page well enough for Claude to extract fields from doesn't need pixel-perfect content extraction — `fetchJobFromUrl` (`lib/actions/analyze.ts`) does a server-side `fetch`, strips `<script>`/`<style>` blocks and all remaining tags with a regex, collapses whitespace, and caps the result at 12,000 characters before handing it to the model. A real readability parser (e.g. `@mozilla/readability` + `jsdom`) would produce cleaner text and handle edge cases (paywalls, SPA-rendered job boards that need a headless browser) better, at the cost of two more dependencies including a DOM implementation. Worth revisiting if job pages with heavy client-side rendering turn out to return mostly-empty text.

## Why AI job analysis and CV matching return JSON instead of structured tool calls

Both `analyzeJobDescription` and `matchCvToJob` (`lib/ai/`) prompt Claude to reply with a raw JSON object and parse it with `extractJson` (`lib/ai/client.ts`), rather than using the Anthropic SDK's tool-use/structured-output support. For a single fixed-shape response per call with no multi-turn tool loop, this is simpler to read and debug (the prompt *is* the schema) at a small robustness cost — `extractJson` strips a stray ```json fence if the model adds one, but a genuinely malformed response will throw and surface as a toast error rather than being caught by schema validation. If these prompts grow more complex, switching to the SDK's structured output support would be the more robust choice.

## Why sign-up and the Pro plan toggle are local-only, not real billing

Nothing in this app has a real backend to hold a Stripe (or similar) secret key safely, and there's no authentication to tie a subscription to. `createSignup` and `setPlan` (`lib/actions/signup.ts`, `lib/actions/profile.ts`) write directly to the local `Signup` and `Profile` tables — no network call, no charge. This mirrors the shape a real flow would have (a `Plan` enum on the user, an upgrade action) so that wiring up real billing later is a matter of replacing those two functions' bodies, not restructuring the schema. See the README's "Real subscriptions / billing" section for what that would actually take.
