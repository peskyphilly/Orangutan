import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCompositionByReference } from "@/lib/composition";
import { gbp, prettyDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BookedPage({
  params,
}: {
  params: { ref: string };
}) {
  const reference = decodeURIComponent(params.ref);
  const composition = await getCompositionByReference(reference);
  if (!composition) notFound();

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/account/signin?next=${encodeURIComponent(`/booked/${reference}`)}`);
  }
  if (composition.userId && composition.userId !== user.id) {
    notFound();
  }

  const { brief } = composition;
  const team =
    composition.teams.list.find(
      (t) => t.id === composition.teams.selectedTeamId
    ) ?? composition.teams.list[0];
  if (!team) notFound();

  const ops = [
    { label: "Contracts issued", value: "5 / 5" },
    { label: "Insurance verified", value: "Confirmed" },
    { label: "Audit trail", value: "Recorded" },
    {
      label: "Delivery confirmation",
      value: `Scheduled ${prettyDate(brief.date)}`,
    },
  ];

  return (
    <main className="min-h-screen bg-white text-ink">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-lg tracking-tight">
          EventOS
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-grey">
          Confirmed
        </span>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-24 pt-8">
        <p className="animate-fade-up font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
          Team confirmed
        </p>
        <h1 className="mt-4 animate-fade-up text-4xl tracking-tight md:text-5xl">
          {brief.occasion} is booked
        </h1>
        <p className="mt-4 flex items-baseline gap-3 font-light text-grey">
          Reference
          <span className="font-mono text-lg text-ink">{reference}</span>
        </p>

        {/* Summary */}
        <div className="mt-12 border border-light-line bg-card p-7">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">
              {team.tag}
            </span>
            <span className="font-mono text-sm text-ink">{gbp(team.total)}</span>
          </div>
          <p className="mt-2 font-light text-grey">
            {prettyDate(brief.date)} · {brief.guests} guests
          </p>
          <ul className="mt-5 divide-y divide-[#E6E3DB] border-t hairline-light">
            {team.rows.map((r) => (
              <li
                key={r.role}
                className="flex items-baseline justify-between py-3"
              >
                <span className="text-sm text-ink">
                  <span className="text-grey">{r.role}</span>
                  <span className="mx-2 text-light-line">·</span>
                  {r.name}
                </span>
                <span className="font-mono text-sm text-ink">{gbp(r.price)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mock ops record */}
        <div className="mt-8">
          <h2 className="text-xl tracking-tight">Operations record</h2>
          <dl className="mt-5 divide-y divide-[#E6E3DB] border-y hairline-light">
            {ops.map((o) => (
              <div
                key={o.label}
                className="flex items-baseline justify-between py-4"
              >
                <dt className="text-sm text-grey">{o.label}</dt>
                <dd className="font-mono text-sm text-ink">{o.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-12 border-t hairline-light pt-8">
          <Link
            href="/compose"
            className="text-sm font-light text-grey underline-offset-4 hover:underline"
          >
            Compose another event
          </Link>
        </div>
      </section>
    </main>
  );
}
