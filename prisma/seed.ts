import { PrismaClient } from "@prisma/client";
import { SUPPLIERS } from "../lib/dataset";

const prisma = new PrismaClient();

async function main() {
  await prisma.supplier.deleteMany();
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
      },
    });
  }
  const count = await prisma.supplier.count();
  console.log(`Seeded ${count} suppliers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
