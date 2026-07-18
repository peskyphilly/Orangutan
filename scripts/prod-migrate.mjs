/**
 * Production migrate helper.
 *
 * Neon was previously synced with `prisma db push`, so tables may already
 * exist without a `_prisma_migrations` history. In that case we mark the
 * baseline migration as applied, then run `migrate deploy` for any new
 * migrations. Fresh empty databases skip the baseline resolve and get the
 * full schema from deploy.
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

async function main() {
  const hasSupplier = await tableExists("Supplier");
  const applied = await migrationApplied(BASELINE);

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
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
