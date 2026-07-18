import { execSync } from "node:child_process";
import path from "node:path";

export default function globalSetup() {
  process.env.DATABASE_URL = `file:${path.resolve(__dirname, "../prisma/test.db")}`;
  execSync("npx prisma db push --skip-generate --force-reset --accept-data-loss", {
    stdio: "inherit",
    env: process.env,
    cwd: path.resolve(__dirname, ".."),
  });
}
