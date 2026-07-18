import { prisma } from "./db";
import { makeAvailabilityCheck } from "./availability";
import { Brief, Supplier, Team, Trace, solve } from "./solver";

// What we persist in Composition.teams: the solved teams plus the funnel trace
// (needed by the composition-summary screen and the empty state) and, once
// booked, which team the user confirmed.
export interface StoredTeams {
  list: Team[];
  trace: Trace;
  selectedTeamId?: string;
}

export class ConfirmConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfirmConflictError";
  }
}

type SupplierRow = {
  id: string;
  vendorId: string | null;
} & Supplier;

async function loadPublishedSuppliers(): Promise<SupplierRow[]> {
  // Published listings only: seeded demo suppliers and vendor-created listings.
  // Vendor drafts stay out until published.
  const rows = await prisma.supplier.findMany({ where: { status: "published" } });
  return rows as unknown as SupplierRow[];
}

export async function createComposition(
  brief: Brief,
  userId?: string | null
): Promise<string> {
  const rows = await loadPublishedSuppliers();
  const blackouts = await prisma.blackout.findMany({
    where: {
      date: brief.date,
      supplierId: { in: rows.map((r) => r.id) },
    },
    select: { supplierId: true },
  });
  const blackedOut = new Set(blackouts.map((b) => b.supplierId));
  const availableOn = makeAvailabilityCheck(brief.date, rows, blackedOut);

  const { teams, trace } = solve(rows, brief, availableOn);
  const stored: StoredTeams = { list: teams, trace };
  const composition = await prisma.composition.create({
    data: {
      brief: JSON.stringify(brief),
      teams: JSON.stringify(stored),
      userId: userId ?? null,
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
  userId: string | null;
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
    userId: c.userId,
  };
}

export async function getCompositionByReference(
  reference: string
): Promise<LoadedComposition | null> {
  const c = await prisma.composition.findUnique({ where: { reference } });
  if (!c) return null;
  return {
    id: c.id,
    brief: JSON.parse(c.brief) as Brief,
    teams: JSON.parse(c.teams) as StoredTeams,
    reference: c.reference,
    status: c.status,
    userId: c.userId,
  };
}

export async function listCompositionsForUser(
  userId: string
): Promise<LoadedComposition[]> {
  const rows = await prisma.composition.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((c) => ({
    id: c.id,
    brief: JSON.parse(c.brief) as Brief,
    teams: JSON.parse(c.teams) as StoredTeams,
    reference: c.reference,
    status: c.status,
    userId: c.userId,
  }));
}

function makeReference(): string {
  const n = 10000 + Math.floor(Math.random() * 89999);
  return `EV-${n}`;
}

export async function confirmComposition(
  id: string,
  teamId: string,
  buyerUserId: string
): Promise<string> {
  const existing = await getComposition(id);
  if (!existing) throw new Error("composition not found");
  if (existing.reference) {
    if (existing.userId && existing.userId !== buyerUserId) {
      throw new ConfirmConflictError("This booking belongs to another account.");
    }
    return existing.reference;
  }

  if (existing.userId && existing.userId !== buyerUserId) {
    throw new ConfirmConflictError("This composition belongs to another account.");
  }

  const team = existing.teams.list.find((t) => t.id === teamId);
  if (!team) throw new ConfirmConflictError("That team is no longer available.");

  const supplierIds = team.rows.map((r) => r.supplierId);
  const date = existing.brief.date;

  try {
    return await prisma.$transaction(async (tx) => {
      // Re-check availability under the transaction so two confirms cannot both win.
      const blocked = await tx.blackout.findMany({
        where: { date, supplierId: { in: supplierIds } },
        select: { supplierId: true },
      });
      if (blocked.length > 0) {
        throw new ConfirmConflictError(
          "One or more suppliers on this team are no longer free on your date. Compose again."
        );
      }

      // Unique (supplierId, date) is the lock. reason=booking means vendors
      // cannot clear these from their unavailable-dates UI.
      await tx.blackout.createMany({
        data: supplierIds.map((supplierId) => ({
          supplierId,
          date,
          reason: "booking",
        })),
      });

      let reference = makeReference();
      for (let attempt = 0; attempt < 5; attempt++) {
        const clash = await tx.composition.findUnique({ where: { reference } });
        if (!clash) break;
        reference = makeReference();
      }

      const stored: StoredTeams = {
        ...existing.teams,
        selectedTeamId: teamId,
      };

      const updated = await tx.composition.updateMany({
        where: { id, status: "composed" },
        data: {
          reference,
          status: "confirmed",
          teams: JSON.stringify(stored),
          userId: buyerUserId,
        },
      });
      if (updated.count === 0) {
        throw new ConfirmConflictError(
          "This composition was already confirmed. Refresh to see the booking."
        );
      }

      const vendors = await tx.supplier.findMany({
        where: { id: { in: supplierIds }, vendorId: { not: null } },
        select: { id: true, vendorId: true },
      });
      const vendorBySupplier = new Map(vendors.map((s) => [s.id, s.vendorId!]));

      const enquiries = team.rows
        .filter((r) => vendorBySupplier.has(r.supplierId))
        .map((r) => ({
          compositionId: id,
          reference,
          vendorId: vendorBySupplier.get(r.supplierId)!,
          supplierId: r.supplierId,
          listingName: r.name,
          role: r.role,
          occasion: existing.brief.occasion,
          eventDate: existing.brief.date,
          guests: existing.brief.guests,
          amount: r.price,
        }));

      if (enquiries.length > 0) {
        await tx.enquiry.createMany({ data: enquiries });
      }

      return reference;
    });
  } catch (err) {
    if (err instanceof ConfirmConflictError) throw err;
    // Unique constraint race on blackouts
    const message = err instanceof Error ? err.message : "";
    if (
      message.includes("Unique constraint") ||
      message.includes("UNIQUE constraint")
    ) {
      throw new ConfirmConflictError(
        "One or more suppliers on this team were just booked. Compose again."
      );
    }
    throw err;
  }
}
