export function gbp(amount: number): string {
  return `£${amount.toLocaleString("en-GB")}`;
}

export function prettyDate(iso: string): string {
  // iso: YYYY-MM-DD → "14 November 2026"
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function recordStamp(recPct: number, recEvents: number): string {
  return `${recPct}% delivered as agreed · ${recEvents} verified events`;
}
