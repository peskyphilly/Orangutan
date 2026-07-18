import { beforeEach, vi } from "vitest";
import path from "node:path";

process.env.DATABASE_URL = `file:${path.resolve(__dirname, "../prisma/test.db")}`;

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
  headers: () => ({
    get: (name: string) => {
      if (name.toLowerCase() === "x-forwarded-for") return "203.0.113.10";
      return null;
    },
  }),
}));

beforeEach(async () => {
  cookieJar.clear();
  const { prisma } = await import("../lib/db");
  await prisma.enquiry.deleteMany();
  await prisma.blackout.deleteMany();
  await prisma.composition.deleteMany();
  await prisma.session.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rateLimit.deleteMany();
});

export function clearCookies() {
  cookieJar.clear();
}
