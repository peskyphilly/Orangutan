// EventOS solver — pure, deterministic, server-side.
//
// An event is a constraint-satisfaction problem. Given one brief, enumerate
// complete supplier teams where every member is available on the date, the
// total fits the budget, and every inter-supplier dependency is satisfied.
//
// This module has no I/O and no framework imports so it can be unit-tested in
// isolation and swapped between a static dataset and a real bookings table.

export type Category =
  | "VENUE"
  | "CATERER"
  | "PRODUCTION"
  | "PHOTOGRAPHER"
  | "FLORIST";

export interface Supplier {
  id: string;
  name: string;
  category: Category;
  price?: number | null; // fixed price, null for caterers
  perHead?: number | null; // caterers only
  capacity?: number | null; // venues only
  kitchen?: boolean | null; // venues
  rigging?: boolean | null; // venues
  stepFree?: boolean | null; // venues
  halal?: boolean | null; // caterers
  needsKitchen?: boolean | null; // caterers
  needsRigging?: boolean | null; // production
  staging?: boolean | null; // production
  recPct: number; // delivered-as-agreed %
  recEvents: number; // count of client-confirmed events
  /** Set for marketplace (vendor-created) listings; null for seeded demo suppliers. */
  vendorId?: string | null;
  /** Vendor business name — preferred buyer-facing label when present. */
  vendorName?: string | null;
}

export interface Brief {
  occasion: string;
  date: string; // YYYY-MM-DD
  guests: number;
  budget: number;
  stepFree: boolean;
  halal: boolean;
  staging: boolean;
  kitchen: boolean;
  rigging: boolean;
}

export type TeamTag = "Recommended" | "Best value" | "Balanced";

export interface TeamRow {
  role: "Venue" | "Catering" | "Production" | "Photography" | "Flowers";
  supplierId: string;
  name: string;
  price: number; // contribution to the total (perHead * guests for catering)
  recPct: number;
  recEvents: number;
}

export interface Team {
  id: string;
  tag?: TeamTag;
  members: {
    venue: Supplier;
    caterer: Supplier;
    production: Supplier;
    photographer: Supplier;
    florist: Supplier;
  };
  rows: TeamRow[];
  total: number;
  underBudget: number;
  quality: number;
}

export type FailedStage =
  | "availability"
  | "venueFit"
  | "requirements"
  | "compatibility";

export interface Trace {
  date: string;
  guests: number;
  budget: number;
  totalSuppliers: number;
  availableSuppliers: number;
  venuesFit: number;
  requirementsMet: number; // suppliers surviving every category requirement filter
  candidateCombos: number; // full cartesian product of the filtered pools
  consistentTeams: number; // combos passing compatibility + budget
  composedTeams: number; // teams actually returned (≤ 3)
  failedStage: FailedStage | null;
  pools: {
    venues: number;
    caterers: number;
    production: number;
    photographers: number;
    florists: number;
  };
}

export interface SolveResult {
  teams: Team[];
  trace: Trace;
}

// ── Availability ────────────────────────────────────────────────────────────
// Default: deterministic pseudo-availability by hashing id+date (~72% free).
// Production compose passes a real check that honours Blackout rows (and treats
// vendor-owned listings as free unless blacked out). Keep this pluggable so the
// solver stays pure and unit-testable.
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type AvailabilityCheck = (id: string, date: string) => boolean;

export function isAvailable(id: string, date: string): boolean {
  return hashStr(`${id}|${date}`) % 100 < 72;
}

// ── Scoring ─────────────────────────────────────────────────────────────────
// Cold-start: newcomers with no verified events get a neutral rank score so
// they can surface in composed teams. Display still uses real recPct/recEvents.
const COLD_START_SCORE = 94;

function memberScore(s: Supplier): number {
  if (s.recEvents === 0) return COLD_START_SCORE;
  return s.recPct + Math.min(s.recEvents, 60) / 12;
}

function teamHasMarketplace(t: Team): boolean {
  const m = t.members;
  return [m.venue, m.caterer, m.production, m.photographer, m.florist].some(
    (s) => Boolean(s.vendorId)
  );
}

/** Seeded rows are demo filler. When a real vendor listing fits, use only those. */
function preferMarketplace(pool: Supplier[]): Supplier[] {
  const real = pool.filter((s) => Boolean(s.vendorId));
  return real.length > 0 ? real : pool;
}

function teamQuality(members: Supplier[]): number {
  const sum = members.reduce((acc, s) => acc + memberScore(s), 0);
  return sum / members.length;
}

// ── Solver ──────────────────────────────────────────────────────────────────
export function solve(
  suppliers: Supplier[],
  brief: Brief,
  availableOn: AvailabilityCheck = isAvailable
): SolveResult {
  const totalSuppliers = suppliers.length;

  // 1. Availability filter.
  const available = suppliers.filter((s) => availableOn(s.id, brief.date));

  const availVenues = available.filter((s) => s.category === "VENUE");
  const availCaterers = available.filter((s) => s.category === "CATERER");
  const availProduction = available.filter((s) => s.category === "PRODUCTION");
  const availPhotographers = available.filter((s) => s.category === "PHOTOGRAPHER");
  const availFlorists = available.filter((s) => s.category === "FLORIST");

  // 2. Category requirement filters, then prefer real marketplace listings over
  // seeded demo suppliers whenever at least one real listing still fits.
  const venues = preferMarketplace(
    availVenues.filter(
      (v) =>
        (v.capacity ?? 0) >= brief.guests &&
        (!brief.stepFree || v.stepFree === true) &&
        (!brief.kitchen || v.kitchen === true) &&
        (!brief.rigging || v.rigging === true)
    )
  );
  const caterers = preferMarketplace(
    availCaterers.filter((c) => !brief.halal || c.halal === true)
  );
  const production = preferMarketplace(
    availProduction.filter((p) => !brief.staging || p.staging === true)
  );
  const photographers = preferMarketplace(availPhotographers);
  const florists = preferMarketplace(availFlorists);

  const requirementsMet =
    venues.length +
    caterers.length +
    production.length +
    photographers.length +
    florists.length;

  // 3. Compatibility enumeration + budget ceiling.
  const teams: Team[] = [];
  let candidateCombos = 0;

  for (const venue of venues) {
    for (const caterer of caterers) {
      if (caterer.needsKitchen && !venue.kitchen) continue;
      for (const prod of production) {
        if (prod.needsRigging && !venue.rigging) continue;
        for (const photographer of photographers) {
          for (const florist of florists) {
            candidateCombos++;
            const total =
              (venue.price ?? 0) +
              (caterer.perHead ?? 0) * brief.guests +
              (prod.price ?? 0) +
              (photographer.price ?? 0) +
              (florist.price ?? 0);
            if (total > brief.budget) continue;

            teams.push(
              buildTeam(brief, venue, caterer, prod, photographer, florist, total)
            );
          }
        }
      }
    }
  }

  const consistentTeams = teams.length;
  const composed = select(teams);

  const failedStage = determineFailedStage({
    available: available.length,
    venues: venues.length,
    caterers: caterers.length,
    production: production.length,
    photographers: photographers.length,
    florists: florists.length,
    consistentTeams,
  });

  const trace: Trace = {
    date: brief.date,
    guests: brief.guests,
    budget: brief.budget,
    totalSuppliers,
    availableSuppliers: available.length,
    venuesFit: venues.length,
    requirementsMet,
    candidateCombos,
    consistentTeams,
    composedTeams: composed.length,
    failedStage,
    pools: {
      venues: venues.length,
      caterers: caterers.length,
      production: production.length,
      photographers: photographers.length,
      florists: florists.length,
    },
  };

  return { teams: composed, trace };
}

function buildTeam(
  brief: Brief,
  venue: Supplier,
  caterer: Supplier,
  production: Supplier,
  photographer: Supplier,
  florist: Supplier,
  total: number
): Team {
  const cateringPrice = (caterer.perHead ?? 0) * brief.guests;
  const rows: TeamRow[] = [
    row("Venue", venue, venue.price ?? 0),
    row("Catering", caterer, cateringPrice),
    row("Production", production, production.price ?? 0),
    row("Photography", photographer, photographer.price ?? 0),
    row("Flowers", florist, florist.price ?? 0),
  ];
  return {
    id: `${venue.id}_${caterer.id}_${production.id}_${photographer.id}_${florist.id}`,
    members: { venue, caterer, production, photographer, florist },
    rows,
    total,
    underBudget: brief.budget - total,
    quality: teamQuality([venue, caterer, production, photographer, florist]),
  };
}

function row(role: TeamRow["role"], s: Supplier, price: number): TeamRow {
  const label = s.vendorName?.trim() || s.name;
  return {
    role,
    supplierId: s.id,
    name: label,
    price,
    recPct: s.recPct,
    recEvents: s.recEvents,
  };
}

// 5. Selection — up to 3 teams that differ in at least venue or caterer where
// possible: highest quality (Recommended), lowest total (Best value), best
// quality/total ratio (Balanced). When marketplace listings exist in the pool
// but none made the cut, replace Balanced with the best-value marketplace team
// so new vendors are not permanently buried by seeded competitors.
function select(teams: Team[]): Team[] {
  if (teams.length === 0) return [];

  const byQuality = [...teams].sort(
    (a, b) => b.quality - a.quality || a.total - b.total
  );
  const byTotal = [...teams].sort(
    (a, b) => a.total - b.total || b.quality - a.quality
  );
  const byRatio = [...teams].sort(
    (a, b) => b.quality / b.total - a.quality / a.total || a.total - b.total
  );

  const chosen: Team[] = [];
  const notYetChosen = (t: Team) => !chosen.some((c) => c.id === t.id);
  const distinct = (t: Team) =>
    chosen.every(
      (c) =>
        c.members.venue.id !== t.members.venue.id ||
        c.members.caterer.id !== t.members.caterer.id
    );

  const add = (sorted: Team[], tag: TeamTag) => {
    let cand = sorted.find((t) => notYetChosen(t) && distinct(t));
    if (!cand) cand = sorted.find(notYetChosen);
    if (cand) {
      cand.tag = tag;
      chosen.push(cand);
    }
  };

  add(byQuality, "Recommended");
  add(byTotal, "Best value");
  add(byRatio, "Balanced");

  if (chosen.length > 0 && !chosen.some(teamHasMarketplace)) {
    const marketplace = [...teams]
      .filter(teamHasMarketplace)
      .sort((a, b) => a.total - b.total || b.quality - a.quality);
    let cand =
      marketplace.find((t) => notYetChosen(t) && distinct(t)) ??
      marketplace.find(notYetChosen) ??
      marketplace[0];
    if (cand) {
      cand = { ...cand, tag: "Balanced" };
      if (chosen.length >= 3) chosen[2] = cand;
      else chosen.push(cand);
    }
  }

  return chosen;
}

// 6. On failure, report which stage of the funnel hit zero.
function determineFailedStage(counts: {
  available: number;
  venues: number;
  caterers: number;
  production: number;
  photographers: number;
  florists: number;
  consistentTeams: number;
}): FailedStage | null {
  if (counts.consistentTeams > 0) return null;
  if (counts.available === 0) return "availability";
  if (counts.venues === 0) return "venueFit";
  if (counts.caterers === 0 || counts.production === 0) return "requirements";
  if (counts.photographers === 0 || counts.florists === 0) return "availability";
  return "compatibility";
}

export const DEMO_BRIEF: Brief = {
  occasion: "Fundraising gala",
  date: "2026-11-14",
  guests: 180,
  budget: 42000,
  stepFree: true,
  halal: true,
  staging: true,
  kitchen: false,
  rigging: false,
};
