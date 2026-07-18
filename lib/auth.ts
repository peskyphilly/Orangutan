import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { hashPassword, verifyPassword, assertPasswordStrength } from "./password";

const COOKIE = "eventos_session";
const SESSION_DAYS = 30;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  vendorId: string | null;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function createSession(userId: string): Promise<void> {
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: { sessionToken, userId, expires },
  });

  cookies().set(COOKIE, sessionToken, cookieOptions(SESSION_DAYS * 24 * 60 * 60));
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { sessionToken: token } });
  }
  cookies().delete(COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: { include: { vendor: true } } },
  });
  if (!session) return null;
  if (session.expires.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    cookies().delete(COOKIE);
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    vendorId: session.user.vendor?.id ?? null,
  };
}

export async function registerBuyer(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user?: AuthUser; error?: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!name) return { error: "Enter your name." };
  if (!email || !/^\S+@\S+\.\S+$/.test(email))
    return { error: "Enter a valid email." };
  const strength = assertPasswordStrength(input.password);
  if (strength) return { error: strength };

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { vendor: true },
  });
  if (existing) {
    return { error: "An account with this email already exists. Sign in instead." };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(input.password),
      role: "BUYER",
    },
    include: { vendor: true },
  });

  await createSession(user.id);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      vendorId: user.vendor?.id ?? null,
    },
  };
}

export async function registerVendor(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ vendorId?: string; error?: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!name) return { error: "Enter your business name." };
  if (!email || !/^\S+@\S+\.\S+$/.test(email))
    return { error: "Enter a valid email." };
  const strength = assertPasswordStrength(input.password);
  if (strength) return { error: strength };

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { vendor: true },
  });
  if (existing) {
    return { error: "An account with this email already exists. Sign in instead." };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(input.password),
      role: "VENDOR",
      vendor: {
        create: {
          name,
          contactEmail: email,
        },
      },
    },
    include: { vendor: true },
  });

  await createSession(user.id);
  return { vendorId: user.vendor!.id };
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<{ user?: AuthUser; error?: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) return { error: "Enter your email and password." };

  const user = await prisma.user.findUnique({
    where: { email },
    include: { vendor: true },
  });
  if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
    return { error: "Incorrect email or password." };
  }

  await createSession(user.id);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      vendorId: user.vendor?.id ?? null,
    },
  };
}
