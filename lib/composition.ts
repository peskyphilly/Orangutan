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

  await createEnquiriesForTeam(id, reference, existing.brief, existing.teams, teamId);
  return reference;
}

// For every member of the confirmed team that is a vendor-owned listing, record
// an enquiry so the vendor sees the booking land in their dashboard. Seeded demo
// suppliers have no vendor, so they generate nothing.
async function createEnquiriesForTeam(
  compositionId: string,
  reference: string,
  brief: Brief,
  teams: StoredTeams,
  teamId: string
) {
  const team = teams.list.find((t) => t.id === teamId);
  if (!team) return;

  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: team.rows.map((r) => r.supplierId) }, vendorId: { not: null } },
    select: { id: true, vendorId: true },
  });
  const vendorBySupplier = new Map(suppliers.map((s) => [s.id, s.vendorId!]));

  const enquiries = team.rows
    .filter((r) => vendorBySupplier.has(r.supplierId))
    .map((r) => ({
      compositionId,
      reference,
      vendorId: vendorBySupplier.get(r.supplierId)!,
      supplierId: r.supplierId,
      listingName: r.name,
      role: r.role,
      occasion: brief.occasion,
      eventDate: brief.date,
      guests: brief.guests,
      amount: r.price,
    }));

  if (enquiries.length > 0) {
    await prisma.enquiry.createMany({ data: enquiries });
  }
}
