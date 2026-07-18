import { prisma } from "./db";
import { CATEGORY_FIELDS, ListingCategory } from "./listing-fields";

export type { ListingCategory } from "./listing-fields";
export { CATEGORY_FIELDS, CATEGORY_LABEL, CATEGORIES } from "./listing-fields";

export interface VendorRecord {
  id: string;
  name: string;
  contactEmail: string | null;
  phone: string | null;
  city: string | null;
}

export interface ListingRecord {
  id: string;
  name: string;
  category: ListingCategory;
  price: number | null;
  perHead: number | null;
  capacity: number | null;
  kitchen: boolean | null;
  rigging: boolean | null;
  stepFree: boolean | null;
  halal: boolean | null;
  needsKitchen: boolean | null;
  needsRigging: boolean | null;
  staging: boolean | null;
  recPct: number;
  recEvents: number;
  status: string;
}

export async function getVendor(id: string): Promise<VendorRecord | null> {
  return prisma.vendor.findUnique({ where: { id } });
}

// Join, or resume an existing vendor if the email is already registered.
export async function joinVendor(input: {
  name: string;
  contactEmail: string;
  phone?: string;
  city?: string;
}): Promise<VendorRecord> {
  const email = input.contactEmail.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { vendor: true },
  });
  if (existingUser?.vendor) return existingUser.vendor;

  const user =
    existingUser ??
    (await prisma.user.create({ data: { email, role: "VENDOR" } }));
  if (user.role !== "VENDOR") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "VENDOR" } });
  }

  return prisma.vendor.create({
    data: {
      userId: user.id,
      name: input.name.trim(),
      contactEmail: email,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
    },
  });
}

export async function findVendorByEmail(
  email: string
): Promise<VendorRecord | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { vendor: true },
  });
  return user?.vendor ?? null;
}

export async function listListings(vendorId: string): Promise<ListingRecord[]> {
  const rows = await prisma.supplier.findMany({
    where: { vendorId },
    orderBy: { name: "asc" },
  });
  return rows as unknown as ListingRecord[];
}

export async function getListing(
  id: string,
  vendorId: string
): Promise<ListingRecord | null> {
  const row = await prisma.supplier.findFirst({ where: { id, vendorId } });
  return (row as unknown as ListingRecord) ?? null;
}

export interface ListingInput {
  name: string;
  category: ListingCategory;
  price?: number | null;
  perHead?: number | null;
  capacity?: number | null;
  kitchen?: boolean;
  rigging?: boolean;
  stepFree?: boolean;
  halal?: boolean;
  needsKitchen?: boolean;
  needsRigging?: boolean;
  staging?: boolean;
  status: string;
}

export async function createListing(vendorId: string, input: ListingInput) {
  // New listings start with no client-confirmed record — records are never
  // self-reported; they accrue only after verified events.
  return prisma.supplier.create({
    data: { ...normalise(input), vendorId, recPct: 0, recEvents: 0 },
  });
}

export async function updateListing(
  id: string,
  vendorId: string,
  input: ListingInput
) {
  return prisma.supplier.updateMany({
    where: { id, vendorId },
    data: normalise(input),
  });
}

export async function deleteListing(id: string, vendorId: string) {
  return prisma.supplier.deleteMany({ where: { id, vendorId } });
}

export async function setListingStatus(
  id: string,
  vendorId: string,
  status: string
) {
  return prisma.supplier.updateMany({ where: { id, vendorId }, data: { status } });
}

// Keep only the fields relevant to the listing's category; null the rest so a
// venue never carries perHead, a caterer never carries capacity, etc.
function normalise(input: ListingInput) {
  const spec = CATEGORY_FIELDS[input.category];
  const flagNames = spec.flags.map((f) => f.name);
  const flag = (name: keyof ListingInput) =>
    flagNames.includes(name as string) ? Boolean(input[name]) : null;

  const usesFixed = spec.pricing === "fixed";
  const usesPerHead = spec.pricing === "perHead";
  const usesCapacity = input.category === "VENUE";

  return {
    name: input.name.trim(),
    category: input.category,
    status: input.status,
    price: usesFixed ? input.price ?? null : null,
    perHead: usesPerHead ? input.perHead ?? null : null,
    capacity: usesCapacity ? input.capacity ?? null : null,
    kitchen: flag("kitchen"),
    rigging: flag("rigging"),
    stepFree: flag("stepFree"),
    halal: flag("halal"),
    needsKitchen: flag("needsKitchen"),
    needsRigging: flag("needsRigging"),
    staging: flag("staging"),
  };
}
