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
