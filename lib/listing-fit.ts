import { Brief, Category, DEMO_BRIEF } from "./solver";
import { flagOn } from "./flags";

export const DEFAULT_BUYER_BRIEF: Brief = {
  ...DEMO_BRIEF,
  // Match compose page checkbox defaults.
  stepFree: true,
  halal: true,
  staging: true,
  kitchen: false,
  rigging: false,
};

export interface ListingFitInput {
  status: string;
  category: Category | string;
  halal?: boolean | number | string | null;
  needsKitchen?: boolean | number | string | null;
  kitchen?: boolean | number | string | null;
  rigging?: boolean | number | string | null;
  stepFree?: boolean | number | string | null;
  staging?: boolean | number | string | null;
  capacity?: number | null;
  perHead?: number | null;
  price?: number | null;
}

export interface ListingFit {
  ok: boolean;
  reasons: string[];
}

/** Why a published listing would or would not enter the default compose pool. */
export function explainListingFit(
  listing: ListingFitInput,
  brief: Brief = DEFAULT_BUYER_BRIEF,
  opts?: { blackedOutOnBriefDate?: boolean }
): ListingFit {
  const reasons: string[] = [];

  if (listing.status !== "published") {
    reasons.push("Listing is not published.");
  }
  if (opts?.blackedOutOnBriefDate) {
    reasons.push(
      `Blocked on ${brief.date} (unavailable date or booking lock).`
    );
  }

  switch (listing.category) {
    case "VENUE": {
      if ((listing.capacity ?? 0) < brief.guests) {
        reasons.push(
          `Capacity ${listing.capacity ?? 0} is below ${brief.guests} guests.`
        );
      }
      if (brief.stepFree && !flagOn(listing.stepFree)) {
        reasons.push("Buyer requires step-free access.");
      }
      if (brief.kitchen && !flagOn(listing.kitchen)) {
        reasons.push("Buyer requires an on-site kitchen.");
      }
      if (brief.rigging && !flagOn(listing.rigging)) {
        reasons.push("Buyer requires venue rigging points.");
      }
      if (listing.price == null || listing.price <= 0) {
        reasons.push("No hire price set.");
      }
      break;
    }
    case "CATERER": {
      if (brief.halal && !flagOn(listing.halal)) {
        reasons.push(
          "Buyer requires halal-capable catering (stored flag is not on)."
        );
      }
      if (listing.perHead == null || listing.perHead <= 0) {
        reasons.push("No price per head set.");
      }
      break;
    }
    case "PRODUCTION": {
      if (brief.staging && !flagOn(listing.staging)) {
        reasons.push("Buyer requires live staging and radio mics.");
      }
      if (listing.price == null || listing.price <= 0) {
        reasons.push("No package price set.");
      }
      break;
    }
    case "PHOTOGRAPHER":
    case "FLORIST": {
      if (listing.price == null || listing.price <= 0) {
        reasons.push("No package price set.");
      }
      break;
    }
  }

  return { ok: reasons.length === 0, reasons };
}
