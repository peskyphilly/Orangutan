import { describe, expect, it } from "vitest";
import {
  Brief,
  DEMO_BRIEF,
  Supplier,
  isAvailable,
  solve,
} from "../lib/solver";
import { SUPPLIERS } from "../lib/dataset";

// Find a date for which every id in the set is available, so compatibility
// tests are not perturbed by the pseudo-availability filter.
function dateWhereAllAvailable(ids: string[]): string {
  for (let d = 1; d <= 366; d++) {
    const date = `2027-01-${String(d).padStart(2, "0")}`;
    const real = `2027-${String(Math.ceil(d / 28)).padStart(2, "0")}-${String(
      ((d - 1) % 28) + 1
    ).padStart(2, "0")}`;
    if (ids.every((id) => isAvailable(id, real))) return real;
  }
  throw new Error("no all-available date found");
}

const baseBrief: Brief = {
  occasion: "Test",
  date: "2027-01-01",
  guests: 100,
  budget: 60000,
  stepFree: false,
  halal: false,
  staging: false,
};

// Minimal one-per-category building blocks.
function mk(overrides: Partial<Supplier> & Pick<Supplier, "id" | "category">): Supplier {
  return {
    name: overrides.name ?? overrides.id,
    recPct: 95,
    recEvents: 40,
    ...overrides,
  } as Supplier;
}

function minimalSet(opts: {
  venue: Partial<Supplier>;
  caterer: Partial<Supplier>;
  production: Partial<Supplier>;
}): { suppliers: Supplier[]; date: string } {
  const venue = mk({ id: "v1", category: "VENUE", price: 10000, capacity: 300, kitchen: true, rigging: true, stepFree: true, ...opts.venue });
  const caterer = mk({ id: "c1", category: "CATERER", perHead: 50, halal: true, needsKitchen: false, ...opts.caterer });
  const production = mk({ id: "p1", category: "PRODUCTION", price: 5000, needsRigging: false, staging: true, ...opts.production });
  const photographer = mk({ id: "ph1", category: "PHOTOGRAPHER", price: 2000 });
  const florist = mk({ id: "f1", category: "FLORIST", price: 1500 });
  const suppliers = [venue, caterer, production, photographer, florist];
  const date = dateWhereAllAvailable(suppliers.map((s) => s.id));
  return { suppliers, date };
}

describe("demo brief", () => {
  it("returns 2–3 fully-consistent teams under budget", () => {
    const { teams, trace } = solve(SUPPLIERS, DEMO_BRIEF);
    expect(teams.length).toBeGreaterThanOrEqual(2);
    expect(teams.length).toBeLessThanOrEqual(3);
    expect(trace.failedStage).toBeNull();

    for (const t of teams) {
      expect(t.total).toBeLessThanOrEqual(DEMO_BRIEF.budget);
      // capacity + step-free
      expect(t.members.venue.capacity!).toBeGreaterThanOrEqual(DEMO_BRIEF.guests);
      expect(t.members.venue.stepFree).toBe(true);
      // halal + staging
      expect(t.members.caterer.halal).toBe(true);
      expect(t.members.production.staging).toBe(true);
      // dependencies
      if (t.members.caterer.needsKitchen) expect(t.members.venue.kitchen).toBe(true);
      if (t.members.production.needsRigging) expect(t.members.venue.rigging).toBe(true);
    }
  });

  it("exposes the real funnel counts in the trace", () => {
    const { trace } = solve(SUPPLIERS, DEMO_BRIEF);
    expect(trace.totalSuppliers).toBe(SUPPLIERS.length);
    expect(trace.availableSuppliers).toBeGreaterThan(0);
    expect(trace.availableSuppliers).toBeLessThanOrEqual(SUPPLIERS.length);
    expect(trace.composedTeams).toBe(solve(SUPPLIERS, DEMO_BRIEF).teams.length);
  });
});

describe("empty-result trace", () => {
  it("£10,000 at 180 guests fails at the budget/compatibility stage, not with an error", () => {
    const brief: Brief = { ...DEMO_BRIEF, budget: 10000 };
    const { teams, trace } = solve(SUPPLIERS, brief);
    expect(teams).toHaveLength(0);
    expect(trace.failedStage).toBe("compatibility");
    // earlier stages still passed
    expect(trace.venuesFit).toBeGreaterThan(0);
    expect(trace.pools.caterers).toBeGreaterThan(0);
  });
});

describe("kitchen dependency rejection", () => {
  it("rejects a kitchen-dependent caterer paired with a kitchenless venue", () => {
    const { suppliers, date } = minimalSet({
      venue: { kitchen: false },
      caterer: { needsKitchen: true },
      production: {},
    });
    const { teams, trace } = solve(suppliers, { ...baseBrief, date });
    expect(teams).toHaveLength(0);
    expect(trace.failedStage).toBe("compatibility");
  });

  it("accepts the same caterer when the venue has a kitchen", () => {
    const { suppliers, date } = minimalSet({
      venue: { kitchen: true },
      caterer: { needsKitchen: true },
      production: {},
    });
    const { teams } = solve(suppliers, { ...baseBrief, date });
    expect(teams).toHaveLength(1);
  });
});

describe("rigging dependency rejection", () => {
  it("rejects a rigging-dependent production company with a riggingless venue", () => {
    const { suppliers, date } = minimalSet({
      venue: { rigging: false },
      caterer: {},
      production: { needsRigging: true },
    });
    const { teams, trace } = solve(suppliers, { ...baseBrief, date });
    expect(teams).toHaveLength(0);
    expect(trace.failedStage).toBe("compatibility");
  });

  it("accepts the same production company when the venue has rigging", () => {
    const { suppliers, date } = minimalSet({
      venue: { rigging: true },
      caterer: {},
      production: { needsRigging: true },
    });
    const { teams } = solve(suppliers, { ...baseBrief, date });
    expect(teams).toHaveLength(1);
  });
});

describe("capacity filter", () => {
  it("drops venues that cannot hold the guest count", () => {
    const { suppliers, date } = minimalSet({
      venue: { capacity: 80 },
      caterer: {},
      production: {},
    });
    const { teams, trace } = solve(suppliers, { ...baseBrief, date, guests: 100 });
    expect(teams).toHaveLength(0);
    expect(trace.venuesFit).toBe(0);
    expect(trace.failedStage).toBe("venueFit");
  });
});

describe("halal filter", () => {
  it("drops non-halal caterers when halal is required", () => {
    const { suppliers, date } = minimalSet({
      venue: {},
      caterer: { halal: false },
      production: {},
    });
    const { teams, trace } = solve(suppliers, { ...baseBrief, date, halal: true });
    expect(teams).toHaveLength(0);
    expect(trace.pools.caterers).toBe(0);
    expect(trace.failedStage).toBe("requirements");
  });
});

describe("step-free filter", () => {
  it("drops venues without step-free access when required", () => {
    const { suppliers, date } = minimalSet({
      venue: { stepFree: false },
      caterer: {},
      production: {},
    });
    const { teams, trace } = solve(suppliers, { ...baseBrief, date, stepFree: true });
    expect(teams).toHaveLength(0);
    expect(trace.venuesFit).toBe(0);
    expect(trace.failedStage).toBe("venueFit");
  });
});

describe("budget ceiling", () => {
  it("rejects a team whose total exceeds the budget and admits it when the budget rises", () => {
    const { suppliers, date } = minimalSet({
      venue: { price: 10000 },
      caterer: { perHead: 50 }, // 50 * 100 = 5000
      production: { price: 5000 },
    });
    // total = 10000 + 5000 + 5000 + 2000 + 1500 = 23500
    const tight = solve(suppliers, { ...baseBrief, date, budget: 23000 });
    expect(tight.teams).toHaveLength(0);
    expect(tight.trace.failedStage).toBe("compatibility");

    const loose = solve(suppliers, { ...baseBrief, date, budget: 23500 });
    expect(loose.teams).toHaveLength(1);
    expect(loose.teams[0].total).toBe(23500);
    expect(loose.teams[0].underBudget).toBe(0);
  });
});

describe("team distinctness", () => {
  it("returned teams differ in at least venue or caterer", () => {
    const { teams } = solve(SUPPLIERS, DEMO_BRIEF);
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const a = teams[i];
        const b = teams[j];
        const differ =
          a.members.venue.id !== b.members.venue.id ||
          a.members.caterer.id !== b.members.caterer.id;
        expect(differ).toBe(true);
      }
    }
  });
});
