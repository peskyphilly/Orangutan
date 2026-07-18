import { describe, expect, it } from "vitest";
import { enforceRateLimit, RATE_LIMITS } from "../lib/rate-limit";
import { prisma } from "../lib/db";

describe("enforceRateLimit", () => {
  it("allows requests under the limit and blocks once exceeded", async () => {
    const key = "test-ip";
    const { limit } = RATE_LIMITS.register;

    for (let i = 0; i < limit; i++) {
      await expect(enforceRateLimit("register", key)).resolves.toBeNull();
    }

    await expect(enforceRateLimit("register", key)).resolves.toBe(
      "Too many attempts. Try again later."
    );

    const row = await prisma.rateLimit.findUnique({
      where: { key: `register:${key}` },
    });
    expect(row?.count).toBe(limit);
  });

  it("resets the window after expiry", async () => {
    const key = "reset-ip";
    await enforceRateLimit("compose", key);
    await prisma.rateLimit.update({
      where: { key: `compose:${key}` },
      data: { resetAt: new Date(Date.now() - 1000), count: 99 },
    });

    await expect(enforceRateLimit("compose", key)).resolves.toBeNull();
    const row = await prisma.rateLimit.findUnique({
      where: { key: `compose:${key}` },
    });
    expect(row?.count).toBe(1);
  });
});
