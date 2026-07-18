import { PrismaClient } from "@prisma/client";
import { SUPPLIERS } from "../lib/dataset";

const prisma = new PrismaClient();

async function main() {
  // Non-destructive: upsert seeded demo suppliers only. Never delete rows, so
  // blackouts and booking history on those ids survive redeploys. Vendor-created
  // listings (vendorId set) are left completely alone.
  for (const s of SUPPLIERS) {
    const data = {
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
      vendorId: null,
    };

    await prisma.supplier.upsert({
      where: { id: s.id },
      create: { id: s.id, ...data },
      update: data,
    });
  }

  const count = await prisma.supplier.count();
  console.log(`Seeded/updated ${SUPPLIERS.length} demo suppliers (${count} total).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
