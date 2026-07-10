import Link from "next/link";
import { notFound } from "next/navigation";
import { getComposition } from "@/lib/composition";
import { gbp, prettyDate } from "@/lib/format";
import { FailedStage, Team } from "@/lib/solver";

export const dynamic = "force-dynamic";

const TAG_ORDER = ["Recommended", "Best value", "Balanced"] as const;

function emptyStateCopy(stage: FailedStage | null): {
  headline: string;
  detail: string;
  loosen: string;
} {
  switch (stage) {
    case "availability":
      return {
        headline: "Too few suppliers are free on this date",
        detail:
          "The availability stage returned too few suppliers to build a complete team.",
        loosen: "Try a different date.",
      };
    case "venueFit":
      return {
        headline: "No venue fits these constraints",
        detail:
          "The venue-fit stage returned zero — no venue meets both the guest count and the access requirement.",
        loosen: "Lower the guest count or relax step-free access.",
      };
    case "requirements":
      return {
        headline: "No supplier meets every requirement",
        detail:
          "The requirements stage returned zero — a non-negotiable removed every candidate in a category.",
        loosen: "Relax one non-negotiable.",
      };
    case "compatibility":
    default:
      return {
        headline: "No consistent team fits this budget",
        detail:
          "Suppliers were available and compatible, but no whole team came in at or under the budget.",
        loosen: "Raise the budget or lower the guest count.",
      };
  }
}

function TeamCard({ team, compositionId }: { team: Team; compositionId: string }) {
  return (
    <article className="flex flex-col border border-light-line bg-card p-7 transition-transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">
          {team.tag}
        </span>
        <span className="font-mono text-[11px] text-grey">
          quality {team.quality.toFixed(1)}
        </span>
      </div>

      <div className="mt-5 flex items-baseline gap-3">
        <span className="font-mono text-3xl text-ink">{gbp(team.total)}</span>
      </div>
      <p className="mt-1 font-mono text-xs text-grey">
        {gbp(team.underBudget)} under budget
      </p>

      <ul className="mt-6 divide-y divide-[#E6E3DB] border-t hairline-light">
        {team.rows.map((r) => (
          <li key={r.role} className="flex items-baseline justify-between py-3">
            <span className="text-sm text-ink">
              <span className="text-grey">{r.role}</span>
              <span className="mx-2 text-light-line">·</span>
              {r.name}
            </span>
            <span className="font-mono text-sm text-ink">{gbp(r.price)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-2">
        <Link
          href={`/teams/${encodeURIComponent(team.id)}?c=${compositionId}`}
          className="inline-flex items-center gap-2 border border-ink px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white focus-visible:bg-ink focus-visible:text-white"
        >
          Review this team
          <span aria-hidden className="font-mono">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: { c?: string };
}) {
  const compositionId = searchParams.c;
  if (!compositionId) notFound();
  const composition = await getComposition(compositionId);
  if (!composition) notFound();

  const { brief } = composition;
  const teams = [...composition.teams.list].sort(
    (a, b) =>
      TAG_ORDER.indexOf(a.tag as (typeof TAG_ORDER)[number]) -
      TAG_ORDER.indexOf(b.tag as (typeof TAG_ORDER)[number])
  );
  const trace = composition.teams.trace;

  return (
    <main className="min-h-screen bg-white text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-lg tracking-tight">
          EventOS
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-grey">
          Composed teams
        </span>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        <p className="animate-fade-up font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
          {brief.occasion} · {prettyDate(brief.date)} · {brief.guests} guests ·{" "}
          {gbp(brief.budget)}
        </p>
        <h1 className="mt-4 animate-fade-up text-4xl tracking-tight md:text-5xl">
          {teams.length > 0
            ? `${teams.length} ${teams.length === 1 ? "team" : "teams"} composed`
            : "No team could be composed"}
        </h1>

        {teams.length > 0 ? (
          <>
            <p className="mt-4 max-w-xl animate-fade-up font-light text-grey">
              Each team is internally consistent — every conflict was resolved
              before this page. Prices are the full team total.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  compositionId={compositionId}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState stage={trace.failedStage} />
        )}
      </section>
    </main>
  );
}

function EmptyState({ stage }: { stage: FailedStage | null }) {
  const copy = emptyStateCopy(stage);
  return (
    <div className="mt-10 max-w-2xl border-l-2 border-gold pl-6">
      <h2 className="text-2xl tracking-tight">{copy.headline}</h2>
      <p className="mt-3 font-light leading-relaxed text-grey">{copy.detail}</p>
      <p className="mt-3 font-light leading-relaxed text-ink">{copy.loosen}</p>
      <Link
        href="/compose"
        className="mt-8 inline-flex items-center gap-2 border border-ink px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white"
      >
        Adjust the brief
        <span aria-hidden className="font-mono">
          →
        </span>
      </Link>
    </div>
  );
}
