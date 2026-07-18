import { AvailabilityCheck, isAvailable } from "./solver";

// Real availability for a compose run:
// 1. Blackout row for that supplier+date → unavailable (vendor-blocked or booked)
// 2. Vendor-owned listing with no blackout → available
// 3. Seeded demo supplier → keep the hash so the demo still has date variety
export function makeAvailabilityCheck(
  date: string,
  suppliers: { id: string; vendorId: string | null }[],
  blackedOutIds: Set<string>
): AvailabilityCheck {
  const vendorOwned = new Set(
    suppliers.filter((s) => s.vendorId).map((s) => s.id)
  );
  return (id, d) => {
    if (d === date && blackedOutIds.has(id)) return false;
    if (vendorOwned.has(id)) return true;
    return isAvailable(id, d);
  };
}
