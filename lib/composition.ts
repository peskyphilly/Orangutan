import { prisma } from "./db";
import { Brief, Supplier, Team, Trace, solve } from "./solver";

// What we persist in Composition.teams — the solved teams plus the funnel trace
// (needed by the composition-summary screen and the empty state) and, once
// booked, which team the user confirmed.
export interface StoredTeams {
  list: Team[];
  trace: Trace;
  selectedTeamId?: string;
}

async function loadSuppliers(): Promise<Supplier[]> {
  // The engine composes from published listings only — seeded demo suppliers and
  // vendor-created listings alike. Vendor drafts stay out until published.
  const rows = await prisma.supplier.findMany({ where: { status: "published" } });
  return rows as unknown as Supplier[];
}

export async function createComposition(brief: Brief): Promise<string> {
  const suppliers = await loadSuppliers();
  const { teams, trace } = solve(suppliers, brief);
  const stored: StoredTeams = { list: teams, trace };
  const composition = await prisma.composition.create({
    data: {
      brief: JSON.stringify(brief),
      teams: JSON.stringify(stored),
    },
  });
  return composition.id;
}

export interface LoadedComposition {
  id: string;
  brief: Brief;
  teams: StoredTeams;
  reference: string | null;
  status: string;
}

export async function getComposition(
  id: string
): Promise<LoadedComposition | null> {
  const c = await prisma.composition.findUnique({ where: { id } });
  if (!c) return null;
  return {
    id: c.id,
    brief: JSON.parse(c.brief) as Brief,
    teams: JSON.parse(c.teams) as StoredTeams,
    reference: c.reference,
    status: c.status,
  };
}

export async function getCompositionByReference(
  reference: string
): Promise<LoadedComposition | null> {
  const c = await prisma.composition.findFirst({ where: { reference } });
  if (!c) return null;
  return {
    id: c.id,
    brief: JSON.parse(c.brief) as Brief,
    teams: JSON.parse(c.teams) as StoredTeams,
    reference: c.reference,
    status: c.status,
  };
}

function makeReference(): string {
  // EV-48213 style: five digits, deterministic-enough for a mock ops record.
  const n = 10000 + Math.floor(Math.random() * 89999);
  return `EV-${n}`;
}

export async function confirmComposition(
  id: string,
  teamId: string
): Promise<string> {
  const existing = await getComposition(id);
  if (!existing) throw new Error("composition not found");
  if (existing.reference) return existing.reference; // idempotent

  const reference = makeReference();
  const stored: StoredTeams = { ...existing.teams, selectedTeamId: teamId };
  await prisma.composition.update({
    where: { id },
    data: {
      reference,
      status: "confirmed",
      teams: JSON.stringify(stored),
    },
  });
  return reference;
}
