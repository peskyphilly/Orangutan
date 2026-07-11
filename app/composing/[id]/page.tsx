import { notFound } from "next/navigation";
import { getComposition } from "@/lib/composition";
import { prettyDate } from "@/lib/format";
import { ComposingSequence, FunnelLine } from "@/components/ComposingSequence";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
  availability: "availability",
  venueFit: "venue fit",
  requirements: "requirements",
  compatibility: "compatibility",
};

export default async function ComposingPage({
  params,
}: {
  params: { id: string };
}) {
  const composition = await getComposition(params.id);
  if (!composition) notFound();

  const { trace } = composition.teams;
  const solved = trace.failedStage === null;

  const lines: FunnelLine[] = [
    { text: "Brief received." },
    {
      emphasis: `${trace.availableSuppliers} of ${trace.totalSuppliers}`,
      text: `suppliers free on ${prettyDate(trace.date)}.`,
    },
    {
      emphasis: String(trace.venuesFit),
      text: `${trace.venuesFit === 1 ? "venue fits" : "venues fit"} ${
        trace.guests
      } guests.`,
    },
    {
      emphasis: String(trace.requirementsMet),
      text: "suppliers meet every requirement.",
    },
    {
      emphasis: String(trace.consistentTeams),
      text: `consistent ${
        trace.consistentTeams === 1 ? "team" : "teams"
      } within budget.`,
    },
    solved
      ? {
          emphasis: String(trace.composedTeams),
          text: `${trace.composedTeams === 1 ? "team" : "teams"} composed.`,
        }
      : {
          text: `No team survived. The ${
            STAGE_LABEL[trace.failedStage!] ?? "compatibility"
          } stage returned nothing.`,
        },
  ];

  return (
    <main className="flex min-h-screen items-center bg-black text-white">
      <div className="gold-glow w-full">
        <div className="mx-auto max-w-2xl px-6 py-24">
          <p className="mb-10 font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            Composing
          </p>
          <ComposingSequence lines={lines} href={`/teams?c=${composition.id}`} />
        </div>
      </div>
    </main>
  );
}
