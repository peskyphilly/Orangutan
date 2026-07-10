# Decisions

Choices not fully specified by the brief. The guiding rule: where a decision was
open, pick the option that makes the constraint engine more visible.

## Missing prototype (`eventos-app.jsx`)

The prototype referenced by the spec was not supplied — only the spec PDF. The
design tokens (§7) and solver behaviour (§4) are fully specified in the spec and
are implemented exactly. The one gap was the **exact supplier dataset**, which the
spec sources from the prototype. A consistent 34-supplier dataset was constructed
to the spec's shape (8 venues, 8 caterers, 6 production, 6 photographers, 6
florists) with prices, flags and delivery records chosen so that every acceptance
criterion holds. It lives isolated in `lib/dataset.ts` and is the single source
for both the Prisma seed and the tests, so dropping in the real dataset later is a
one-file change. The names `One Moorgate Place` and `Maison Verte` from the spec's
worked example are honoured (venue with kitchen; caterer that needs one).

## SQLite type mapping

Prisma's SQLite connector supports neither `enum` nor `Json`. Mapped to strings:

- `Supplier.category` is a `String`, validated by the `Category` union type in
  `lib/solver.ts` (`VENUE | CATERER | PRODUCTION | PHOTOGRAPHER | FLORIST`).
- `Composition.brief` and `Composition.teams` are JSON-serialised `String`s. The
  serialisation is confined to `lib/composition.ts`.

## Persistence & session state

The brief, the solved teams and the funnel trace are persisted in a
`Composition` row keyed by cuid. Every screen after the brief is addressed by that
id (`/composing/[id]`, `/teams?c=<id>`, `/teams/[id]?c=<id>`) or by the booking
reference (`/booked/[ref]`), so a refresh never loses the composition. The
`Composition.teams` payload is stored as `{ list, trace, selectedTeamId? }` — a
superset of "the solved teams" so the composition-summary animation and the empty
state can read the real trace without re-solving.

## The trace is the product

The solver returns a `Trace` with the real funnel counts at every stage
(availability → venue fit → requirements → compatibility → composed) and, on
failure, the exact stage that hit zero. The composition-summary screen renders
those numbers directly; the empty state names the failing stage. No count on
these screens is hardcoded.

## Availability

MVP availability is the deterministic `isAvailable(id, date)` hash (~72% free),
exactly as the spec describes. It is a single exported function so the swap to a
real bookings-table check is one edit. Unit tests that exercise compatibility
search for a date on which the relevant suppliers are all available, so they are
not perturbed by the availability filter.

## Solver selection

Up to three teams: highest quality (Recommended), lowest total (Best value), best
quality/total ratio (Balanced). Selection prefers teams that differ in at least
venue or caterer, falling back to the best available team when fewer than three
distinct options exist ("where possible", per §4.5).
