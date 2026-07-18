/** Capability flags from Prisma/SQLite/forms can be boolean, 0/1, or null. */
export function flagOn(
  value: boolean | number | string | null | undefined
): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}
