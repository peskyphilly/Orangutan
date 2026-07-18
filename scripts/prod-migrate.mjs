/**
 * Production migrate helper.
 *
 * Neon was previously synced with `prisma db push`, so tables may already
 * exist without a `_prisma_migrations` history. In that case we mark the
 * baseline migration as applied, then run `migrate deploy` for any new
 * migrations. Fresh empty databases skip the baseline resolve and get the
 * full schema from deploy.
 *
 * Also repairs drift: if a migration is recorded as applied but its table is
 * missing (can happen after a bad baseline), recreate the missing objects.
 */
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const BASELINE = "20260718234500_baseline";
const SCHEMA = "prisma/schema.production.prisma";
const prisma = new PrismaClient();

async function tableExists(tableName) {
  const rows = await prisma.$queryRaw`
    SELECT 1 AS ok
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
    LIMIT 1
  `;
  return Array.isArray(rows) && rows.length > 0;
}

async function migrationApplied(name) {
  if (!(await tableExists("_prisma_migrations"))) return false;
  const rows = await prisma.$queryRaw`
    SELECT 1 AS ok
    FROM "_prisma_migrations"
    WHERE migration_name = ${name}
    LIMIT 1
  `;
  return Array.isArray(rows) && rows.length > 0;
}

async function listAppliedMigrations() {
  if (!(await tableExists("_prisma_migrations"))) return [];
  const rows = await prisma.$queryRaw`
    SELECT migration_name
    FROM "_prisma_migrations"
    ORDER BY finished_at ASC NULLS LAST, started_at ASC
  `;
  return rows.map((r) => r.migration_name);
}

async function ensureRateLimitTable() {
  if (await tableExists("RateLimit")) return;
  console.log("RateLimit table missing — creating (repair).");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "RateLimit" (
      "key" TEXT NOT NULL,
      "count" INTEGER NOT NULL DEFAULT 0,
      "resetAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
    );
  `);
}

async function main() {
  const hasSupplier = await tableExists("Supplier");
  const applied = await migrationApplied(BASELINE);
  console.log("Applied migrations:", (await listAppliedMigrations()).join(", ") || "(none)");
  console.log("Supplier table:", hasSupplier ? "yes" : "no");
  console.log("RateLimit table:", (await tableExists("RateLimit")) ? "yes" : "no");

  if (hasSupplier && !applied) {
    console.log(
      `Existing schema detected without migration history — marking ${BASELINE} as applied.`
    );
    execSync(`npx prisma migrate resolve --applied ${BASELINE} --schema=${SCHEMA}`, {
      stdio: "inherit",
    });
  }

  console.log("Running prisma migrate deploy...");
  execSync(`npx prisma migrate deploy --schema=${SCHEMA}`, { stdio: "inherit" });

  await ensureRateLimitTable();
  console.log(
    "Post-migrate RateLimit table:",
    (await tableExists("RateLimit")) ? "yes" : "no"
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
