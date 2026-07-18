import { headers } from "next/headers";
import { prisma } from "./db";

export const RATE_LIMITS = {
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  signin: { limit: 10, windowMs: 15 * 60 * 1000 },
  compose: { limit: 10, windowMs: 60 * 60 * 1000 },
  confirm: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

const ERROR = "Too many attempts. Try again later.";

/** Best-effort client IP from reverse-proxy headers (Vercel). */
export function clientIp(): string {
  try {
    const h = headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    const real = h.get("x-real-ip")?.trim();
    if (real) return real;
  } catch {
    // Outside a request context (tests / scripts).
  }
  return "unknown";
}

/**
 * Fixed-window rate limit backed by Postgres/SQLite so counters are shared
 * across Vercel serverless instances. Returns an error message when blocked.
 */
export async function enforceRateLimit(
  bucket: RateLimitBucket,
  key: string
): Promise<string | null> {
  const { limit, windowMs } = RATE_LIMITS[bucket];
  const fullKey = `${bucket}:${key}`;
  const now = new Date();

  const existing = await prisma.rateLimit.findUnique({ where: { key: fullKey } });

  if (!existing || existing.resetAt.getTime() <= now.getTime()) {
    await prisma.rateLimit.upsert({
      where: { key: fullKey },
      create: {
        key: fullKey,
        count: 1,
        resetAt: new Date(now.getTime() + windowMs),
      },
      update: {
        count: 1,
        resetAt: new Date(now.getTime() + windowMs),
      },
    });
    return null;
  }

  if (existing.count >= limit) return ERROR;

  await prisma.rateLimit.update({
    where: { key: fullKey },
    data: { count: { increment: 1 } },
  });
  return null;
}
