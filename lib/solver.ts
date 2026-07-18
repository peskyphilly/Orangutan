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

type MemberRole =
  | "venue"
  | "caterer"
  | "production"
  | "photographer"
  | "florist";

const MEMBER_ROLES: MemberRole[] = [
  "venue",
  "caterer",
  "production",
  "photographer",
  "florist",
];

function teamHasMarketplace(t: Team): boolean {
  return MEMBER_ROLES.some((role) => Boolean(t.members[role].vendorId));
}

function marketplaceRolesInPool(teams: Team[]): Set<MemberRole> {
  const roles = new Set<MemberRole>();
  for (const t of teams) {
    for (const role of MEMBER_ROLES) {
      if (t.members[role].vendorId) roles.add(role);
    }
  }
  return roles;
}

function teamCoversMarketplaceRole(t: Team, role: MemberRole): boolean {
  return Boolean(t.members[role].vendorId);
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

function enumerateTeams(
  brief: Brief,
  venues: Supplier[],
  caterers: Supplier[],
  production: Supplier[],
  photographers: Supplier[],
  florists: Supplier[]
): { teams: Team[]; candidateCombos: number } {
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

  return { teams, candidateCombos };
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

  // 2. Category requirement filters.
  const venuesAll = availVenues.filter(
    (v) =>
      (v.capacity ?? 0) >= brief.guests &&
      (!brief.stepFree || v.stepFree === true) &&
      (!brief.kitchen || v.kitchen === true) &&
      (!brief.rigging || v.rigging === true)
  );
  const caterersAll = availCaterers.filter(
    (c) => !brief.halal || c.halal === true
  );
  const productionAll = availProduction.filter(
    (p) => !brief.staging || p.staging === true
  );
  const photographersAll = availPhotographers;
  const floristsAll = availFlorists;

  // 3. Prefer real marketplace listings over seeded demos, but if that yields
  // zero teams (e.g. one pricey real venue), fall back to the full pool so
  // compose never blanks incorrectly.
  const preferred = {
    venues: preferMarketplace(venuesAll),
    caterers: preferMarketplace(caterersAll),
    production: preferMarketplace(productionAll),
    photographers: preferMarketplace(photographersAll),
    florists: preferMarketplace(floristsAll),
  };

  let { teams, candidateCombos } = enumerateTeams(
    brief,
    preferred.venues,
    preferred.caterers,
    preferred.production,
    preferred.photographers,
    preferred.florists
  );

  let venues = preferred.venues;
  let caterers = preferred.caterers;
  let production = preferred.production;
  let photographers = preferred.photographers;
  let florists = preferred.florists;

  if (teams.length === 0) {
    ({ teams, candidateCombos } = enumerateTeams(
      brief,
      venuesAll,
      caterersAll,
      productionAll,
      photographersAll,
      floristsAll
    ));
    venues = venuesAll;
    caterers = caterersAll;
    production = productionAll;
    photographers = photographersAll;
    florists = floristsAll;
  }

  const requirementsMet =
    venues.length +
    caterers.length +
    production.length +
    photographers.length +
    florists.length;

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
// quality/total ratio (Balanced). Then ensure each role that has a real
// marketplace listing in the pool appears on at least one returned team, so a
// cheap photographer cannot "satisfy" marketplace coverage for catering.
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

  if (chosen.length === 0) return chosen;

  // Team-level rescue first (any marketplace member).
  if (!chosen.some(teamHasMarketplace)) {
    const marketplace = [...teams]
      .filter(teamHasMarketplace)
      .sort((a, b) => a.total - b.total || b.quality - a.quality);
    let cand =
      marketplace.find((t) => notYetChosen(t) && distinct(t)) ??
      marketplace.find(notYetChosen) ??
      marketplace[0];
    if (cand) {
      cand = { ...cand, tag: chosen[2]?.tag ?? "Balanced" };
      if (chosen.length >= 3) chosen[2] = cand;
      else chosen.push(cand);
    }
  }

  // Role-level rescue: photography coverage must not hide a missing caterer.
  const rolesWithMarketplace = marketplaceRolesInPool(teams);
  for (const role of rolesWithMarketplace) {
    if (chosen.some((t) => teamCoversMarketplaceRole(t, role))) continue;

    const candidates = [...teams]
      .filter((t) => teamCoversMarketplaceRole(t, role))
      .sort((a, b) => a.total - b.total || b.quality - a.quality);
    const cand =
      candidates.find((t) => notYetChosen(t) && distinct(t)) ??
      candidates.find(notYetChosen) ??
      candidates[0];
    if (!cand) continue;

    // Replace the chosen team whose removal loses the fewest other marketplace roles.
    let replaceAt = chosen.length - 1;
    let bestLoss = Number.POSITIVE_INFINITY;
    for (let i = 0; i < chosen.length; i++) {
      const current = chosen[i]!;
      if (teamCoversMarketplaceRole(current, role)) continue;
      let loss = 0;
      for (const other of rolesWithMarketplace) {
        if (other === role) continue;
        const onlyHere =
          teamCoversMarketplaceRole(current, other) &&
          !chosen.some(
            (t, j) => j !== i && teamCoversMarketplaceRole(t, other)
          );
        if (onlyHere) loss++;
      }
      if (loss < bestLoss) {
        bestLoss = loss;
        replaceAt = i;
      }
    }

    const tag = chosen[replaceAt]?.tag ?? "Balanced";
    chosen[replaceAt] = { ...cand, tag };
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
