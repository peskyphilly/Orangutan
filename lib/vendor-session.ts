import { cookies } from "next/headers";

// Lightweight vendor identity for the demo: the signed-in vendor's id lives in an
// httpOnly cookie. This is intentionally simple so the vendor flow is fully
// demoable without an email/OAuth provider. Swap for Auth.js sessions (the
// Account/Session tables already exist) when real authentication is needed.
const COOKIE = "eventos_vendor";

export function setVendorSession(vendorId: string) {
  cookies().set(COOKIE, vendorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export function getVendorSessionId(): string | null {
  return cookies().get(COOKIE)?.value ?? null;
}

export function clearVendorSession() {
  cookies().delete(COOKIE);
}
