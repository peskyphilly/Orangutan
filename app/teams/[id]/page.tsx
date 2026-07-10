import Link from "next/link";
import { notFound } from "next/navigation";
import { getComposition } from "@/lib/composition";
import { gbp, prettyDate, recordStamp } from "@/lib/format";
import { Brief, Team } from "@/lib/solver";
import { confirmAction } from "@/app/actions";

export const dynamic = "force-dynamic";

interface Tie {
  pair: string;
  detail: string;
}

function resolvedTies(team: Team, brief: Brief): Tie[] {
  const { venue, caterer, production } = team.members;
  const ties: Tie[] = [];

  ties.push({
    pair: "Venue ↔ Catering",
    detail: caterer.needsKitchen
      ? `${venue.name} has the on-site kitchen ${caterer.name} requires.`
      : `${caterer.name} cooks off-site — no kitchen dependency to satisfy.`,
  });

  ties.push({
    pair: "Venue ↔ Production",
    detail: production.needsRigging
      ? `${venue.name} carries the rigging ${production.name} requires.`
      : `${production.name} is free-standing — no rigging dependency to satisfy.`,
  });

  ties.push({
    pair: "Capacity",
    detail: `${venue.name} holds ${venue.capacity}. At ${brief.guests} guests, ${
      (venue.capacity ?? 0) - brief.guests
    } places to spare.`,
  });

  if (brief.stepFree) {
    ties.push({
      pair: "Access",
      detail: `${venue.name} is step-free, meeting the access requirement.`,
    });
  }
  if (brief.halal) {
    ties.push({
      pair: "Catering",
      detail: `${caterer.name} is halal-capable, meeting the dietary requirement.`,
    });
  }
  if (brief.staging) {
    ties.push({
      pair: "Production",
      detail: `${production.name} provides live staging and radio mics.`,
    });
  }

  ties.push({
    pair: "Budget ceiling",
    detail: `Team total ${gbp(team.total)} sits ${gbp(
      team.underBudget
    )} under the ${gbp(brief.budget)} ceiling.`,
  });

  return ties;
}

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { c?: string };
}) {
  const compositionId = searchParams.c;
  if (!compositionId) notFound();
  const composition = await getComposition(compositionId);
  if (!composition) notFound();

  const teamId = decodeURIComponent(params.id);
  const team = composition.teams.list.find((t) => t.id === teamId);
  if (!team) notFound();

  const { brief } = composition;
  const ties = resolvedTies(team, brief);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="gold-glow">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <Link href="/" className="font-display text-lg tracking-tight">
            EventOS
          </Link>
          <Link
            href={`/teams?c=${compositionId}`}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim underline-offset-4 hover:underline"
          >
            ← All teams
          </Link>
        </header>

        <section className="mx-auto max-w-5xl px-6 pb-16 pt-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            {team.tag} · {brief.occasion} · {prettyDate(brief.date)}
          </p>
          <h1 className="mt-4 text-4xl tracking-tight md:text-5xl">
            {gbp(team.total)}
            <span className="ml-3 align-middle font-mono text-sm text-dim">
              {gbp(team.underBudget)} under budget
            </span>
          </h1>
        </section>
      </div>

      <div className="mx-auto grid max-w-5xl gap-px border-t hairline-dark bg-[rgba(248,247,244,0.08)] px-6 py-0 md:grid-cols-2 md:gap-12 md:border-0 md:bg-transparent md:px-6 md:py-12">
        {/* Panel A — the team */}
        <section className="bg-black py-12 md:py-0">
          <h2 className="text-xl tracking-tight">The team</h2>
          <ul className="mt-6 divide-y divide-[rgba(248,247,244,0.1)] border-y hairline-dark">
            {team.rows.map((r) => (
              <li key={r.role} className="py-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-white">
                    <span className="text-dim">{r.role}</span>
                    <span className="mx-2 text-[rgba(248,247,244,0.25)]">·</span>
                    {r.name}
                  </span>
                  <span className="font-mono text-sm text-white">
                    {gbp(r.price)}
                  </span>
                </div>
                <p className="mt-1.5 font-mono text-[11px] text-dim">
                  {recordStamp(r.recPct, r.recEvents)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-sm text-dim">Team total</span>
            <span className="font-mono text-lg text-white">
              {gbp(team.total)}
            </span>
          </div>
        </section>

        {/* Panel B — resolved before you saw this page */}
        <section className="bg-black py-12 md:py-0">
          <h2 className="text-xl tracking-tight">
            Resolved before you saw this page
          </h2>
          <p className="mt-3 font-light leading-relaxed text-dim">
            Every dependency between these suppliers was satisfied by the engine
            during composition. Nothing here is left for you to check.
          </p>
          <dl className="mt-6 space-y-5">
            {ties.map((tie) => (
              <div key={tie.pair} className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                />
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold-soft">
                    {tie.pair}
                  </dt>
                  <dd className="mt-1 font-light leading-snug text-white">
                    {tie.detail}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="border-t hairline-dark">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md font-light text-dim">
            Confirming issues the mock contracts and records the audit trail. No
            payment is taken in this MVP.
          </p>
          <form action={confirmAction}>
            <input type="hidden" name="compositionId" value={compositionId} />
            <input type="hidden" name="teamId" value={team.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-3 bg-gold px-7 py-3.5 font-medium text-black transition-transform hover:-translate-y-1 focus-visible:-translate-y-1"
            >
              Confirm this team
              <span aria-hidden className="font-mono">
                →
              </span>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
