import { recordStamp } from "@/lib/format";

// Client-confirmed delivery record — never self-reported, never a star rating.
export function RecordStamp({
  recPct,
  recEvents,
  tone = "light",
}: {
  recPct: number;
  recEvents: number;
  tone?: "light" | "dark";
}) {
  const color = tone === "dark" ? "text-dim" : "text-grey";
  return (
    <span className={`font-mono text-[11px] leading-none tracking-tight ${color}`}>
      {recordStamp(recPct, recEvents)}
    </span>
  );
}
