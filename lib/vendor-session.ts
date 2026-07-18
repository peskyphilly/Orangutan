import { getCurrentUser } from "./auth";

// Vendor identity comes from the signed-in user session (password auth).
// Kept as a thin helper so existing vendor routes stay readable.
export async function getVendorSessionId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.vendorId ?? null;
}
