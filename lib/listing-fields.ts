// Pure, client-safe listing metadata (no Prisma import) so both the server-side
// vendor helpers and the client intake form can share it.
import { Category } from "./solver";

export type ListingCategory = Category;

export const CATEGORIES: ListingCategory[] = [
  "VENUE",
  "CATERER",
  "PRODUCTION",
  "PHOTOGRAPHER",
  "FLORIST",
];

export const CATEGORY_LABEL: Record<ListingCategory, string> = {
  VENUE: "Venue",
  CATERER: "Catering",
  PRODUCTION: "Production",
  PHOTOGRAPHER: "Photography",
  FLORIST: "Flowers",
};

export interface FieldSpec {
  numbers: { name: string; label: string; hint?: string }[];
  flags: { name: string; label: string }[];
  pricing: "fixed" | "perHead";
}

export const CATEGORY_FIELDS: Record<ListingCategory, FieldSpec> = {
  VENUE: {
    pricing: "fixed",
    numbers: [
      { name: "price", label: "Hire price (£)" },
      { name: "capacity", label: "Capacity (guests)" },
    ],
    flags: [
      { name: "kitchen", label: "On-site kitchen" },
      { name: "rigging", label: "Rigging points" },
      { name: "stepFree", label: "Step-free access" },
    ],
  },
  CATERER: {
    pricing: "perHead",
    numbers: [{ name: "perHead", label: "Price per head (£)" }],
    flags: [
      { name: "halal", label: "Halal-capable" },
      { name: "needsKitchen", label: "Needs an on-site kitchen" },
    ],
  },
  PRODUCTION: {
    pricing: "fixed",
    numbers: [{ name: "price", label: "Package price (£)" }],
    flags: [
      { name: "staging", label: "Provides live staging & radio mics" },
      { name: "needsRigging", label: "Needs venue rigging points" },
    ],
  },
  PHOTOGRAPHER: {
    pricing: "fixed",
    numbers: [{ name: "price", label: "Package price (£)" }],
    flags: [],
  },
  FLORIST: {
    pricing: "fixed",
    numbers: [{ name: "price", label: "Package price (£)" }],
    flags: [],
  },
};
