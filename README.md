# EventOS

Your event, solved. Not searched.

EventOS treats an event as a constraint-satisfaction problem. A user submits one
brief — occasion, date, guests, budget, hard requirements — and the engine returns
complete supplier teams where every member is free on the date, the total fits the
budget, and every inter-supplier dependency (kitchen, rigging, capacity, access,
dietary, staging) is already resolved.

Two things are always visible in the product:

- **Composition, not search.** You review solved teams, never a vendor list.
- **Client-confirmed records, not reviews.** Every supplier carries a record of the
  form `97% delivered as agreed · 41 verified events`. No star ratings anywhere.

## Stack

- Next.js 14 (App Router) + TypeScript, strict mode
- Tailwind CSS with the design tokens configured in `tailwind.config.ts`
- SQLite via Prisma (single-file DB, zero infra)
- Vitest for the solver unit tests

## Getting started

```bash
npm i
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npx prisma db seed       # loads the 34-supplier dataset
npm run dev              # http://localhost:3000
```

## Deploy a hosted version (Vercel + Postgres)

Local dev uses SQLite. A hosted deploy needs a persistent database, so production
runs on PostgreSQL via `prisma/schema.production.prisma` — the app code is
identical; only the Vercel build (`npm run build:vercel`) targets Postgres, and it
pushes the schema and seeds the 34 suppliers automatically on each deploy.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpeskyphilly%2FOrangutan%2Ftree%2Fclaude%2Fnew-session-vgoh0m&env=DATABASE_URL&envDescription=PostgreSQL%20connection%20string%20(e.g.%20a%20free%20database%20from%20neon.tech)&project-name=eventos&repository-name=eventos)

Steps:

1. Create a free Postgres database at [neon.tech](https://neon.tech) and copy its
   connection string (the direct, non-pooled one, ending in `?sslmode=require`).
2. Click **Deploy with Vercel** above (or import the repo at
   [vercel.com/new](https://vercel.com/new) and select this branch).
3. When prompted, set the `DATABASE_URL` environment variable to your Neon string.
4. Deploy. The build creates the schema, seeds the suppliers, and builds the app —
   Vercel hands you an `https://…vercel.app` URL that opens in any browser.

## Testing

```bash
npm test
```

The suite covers the solver end to end: kitchen and rigging dependency rejection,
capacity / halal / step-free filters, the budget ceiling, the empty-result trace,
and team distinctness.

## The flow (six screens)

1. `/` — landing (dark)
2. `/compose` — the brief (light)
3. `/composing/[id]` — the composition summary, animated from the real solver trace
4. `/teams?c=[id]` — up to three composed teams, or a plain empty state naming the
   funnel stage that hit zero
5. `/teams/[id]?c=[id]` — team detail with the resolved-ties panel
6. `/booked/[ref]` — confirmation with the mock operations record

## Where things live

- `lib/solver.ts` — the pure, tested constraint solver (no I/O)
- `lib/dataset.ts` — the supplier dataset (single source for seed + tests)
- `lib/composition.ts` — persistence (solve → store → confirm)
- `app/` — the six screens and the server actions
- `DECISIONS.md` — choices not fully pinned down by the spec
