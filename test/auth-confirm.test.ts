import { describe, expect, it } from "vitest";
import { getCurrentUser, registerBuyer, signIn } from "../lib/auth";
import { hashPassword } from "../lib/password";
import {
  ConfirmConflictError,
  confirmComposition,
  createComposition,
} from "../lib/composition";
import { prisma } from "../lib/db";
import { SUPPLIERS } from "../lib/dataset";
import { DEMO_BRIEF } from "../lib/solver";
import { clearCookies } from "./setup";

async function seedSuppliers() {
  for (const s of SUPPLIERS) {
    await prisma.supplier.create({
      data: {
        id: s.id,
        name: s.name,
        category: s.category,
        price: s.price ?? null,
        perHead: s.perHead ?? null,
        capacity: s.capacity ?? null,
        kitchen: s.kitchen ?? null,
        rigging: s.rigging ?? null,
        stepFree: s.stepFree ?? null,
        halal: s.halal ?? null,
        needsKitchen: s.needsKitchen ?? null,
        needsRigging: s.needsRigging ?? null,
        staging: s.staging ?? null,
        recPct: s.recPct,
        recEvents: s.recEvents,
        status: "published",
      },
    });
  }
}

async function createBuyer(email: string, name = "Buyer") {
  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hashPassword("password1"),
      role: "BUYER",
    },
  });
}

describe("auth", () => {
  it("rejects duplicate registration", async () => {
    const first = await registerBuyer({
      name: "Ada",
      email: "ada@example.com",
      password: "password1",
    });
    expect(first.error).toBeUndefined();
    expect(first.user?.email).toBe("ada@example.com");

    const second = await registerBuyer({
      name: "Ada Two",
      email: "ada@example.com",
      password: "password1",
    });
    expect(second.error).toBe(
      "An account with this email already exists. Sign in instead."
    );
  });

  it("rejects weak passwords", async () => {
    const result = await registerBuyer({
      name: "Ada",
      email: "weak@example.com",
      password: "short",
    });
    expect(result.error).toBe("Password must be at least 8 characters.");
  });

  it("creates a session on register and restores it via getCurrentUser", async () => {
    const result = await registerBuyer({
      name: "Ada",
      email: "session@example.com",
      password: "password1",
    });
    expect(result.user).toBeTruthy();

    const sessions = await prisma.session.findMany({
      where: { userId: result.user!.id },
    });
    expect(sessions).toHaveLength(1);

    const current = await getCurrentUser();
    expect(current?.id).toBe(result.user!.id);
    expect(current?.email).toBe("session@example.com");
  });

  it("signs in with the correct password and rejects the wrong one", async () => {
    await registerBuyer({
      name: "Ada",
      email: "login@example.com",
      password: "password1",
    });
    clearCookies();

    const bad = await signIn({
      email: "login@example.com",
      password: "wrong-password",
    });
    expect(bad.error).toBe("Incorrect email or password.");
    expect(await getCurrentUser()).toBeNull();

    const good = await signIn({
      email: "login@example.com",
      password: "password1",
    });
    expect(good.error).toBeUndefined();
    expect(good.user?.email).toBe("login@example.com");
    expect((await getCurrentUser())?.email).toBe("login@example.com");
  });
});

describe("confirmComposition", () => {
  it("blocks another buyer from confirming an owned composition", async () => {
    await seedSuppliers();
    const owner = await createBuyer("owner@example.com", "Owner");
    const other = await createBuyer("other@example.com", "Other");

    const compositionId = await createComposition(DEMO_BRIEF, owner.id);
    const composition = await prisma.composition.findUniqueOrThrow({
      where: { id: compositionId },
    });
    const teams = JSON.parse(composition.teams) as { list: { id: string }[] };
    expect(teams.list.length).toBeGreaterThan(0);

    await expect(
      confirmComposition(compositionId, teams.list[0]!.id, other.id)
    ).rejects.toMatchObject({
      name: "ConfirmConflictError",
      message: "This composition belongs to another account.",
    });
  });

  it("locks booking blackouts and is idempotent for the same buyer", async () => {
    await seedSuppliers();
    const buyer = await createBuyer("buyer@example.com");

    const compositionId = await createComposition(DEMO_BRIEF, buyer.id);
    const composition = await prisma.composition.findUniqueOrThrow({
      where: { id: compositionId },
    });
    const stored = JSON.parse(composition.teams) as {
      list: { id: string; rows: { supplierId: string }[] }[];
    };
    const team = stored.list[0]!;
    expect(team).toBeTruthy();

    const reference = await confirmComposition(compositionId, team.id, buyer.id);
    expect(reference).toMatch(/^EV-\d+$/);

    const confirmed = await prisma.composition.findUniqueOrThrow({
      where: { id: compositionId },
    });
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.reference).toBe(reference);
    expect(confirmed.userId).toBe(buyer.id);

    const blackouts = await prisma.blackout.findMany({
      where: {
        date: DEMO_BRIEF.date,
        supplierId: { in: team.rows.map((r) => r.supplierId) },
      },
    });
    expect(blackouts).toHaveLength(team.rows.length);
    expect(blackouts.every((b) => b.reason === "booking")).toBe(true);

    const again = await confirmComposition(compositionId, team.id, buyer.id);
    expect(again).toBe(reference);
  });

  it("rejects confirm when the booking already belongs to someone else", async () => {
    await seedSuppliers();
    const owner = await createBuyer("owner2@example.com");
    const other = await createBuyer("other2@example.com");

    const compositionId = await createComposition(DEMO_BRIEF, null);
    const composition = await prisma.composition.findUniqueOrThrow({
      where: { id: compositionId },
    });
    const teams = JSON.parse(composition.teams) as { list: { id: string }[] };
    const teamId = teams.list[0]!.id;

    const reference = await confirmComposition(compositionId, teamId, owner.id);
    expect(reference).toMatch(/^EV-\d+$/);

    await expect(
      confirmComposition(compositionId, teamId, other.id)
    ).rejects.toBeInstanceOf(ConfirmConflictError);
    await expect(
      confirmComposition(compositionId, teamId, other.id)
    ).rejects.toThrow("This booking belongs to another account.");
  });
});
