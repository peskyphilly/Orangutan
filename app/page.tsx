import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const supplierCount = await prisma.supplier.count();

  const stats = [
    { value: String(supplierCount), label: "suppliers in the composition set" },
    { value: "<2s", label: "median composition" },
    { value: "100%", label: "client-confirmed records" },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="gold-glow">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="font-display text-lg tracking-tightest">EventOS</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim">
            Composition engine
          </span>
        </header>

        <section className="mx-auto max-w-6xl px-6 pb-28 pt-20 md:pt-28">
          <p className="animate-fade-up font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            Every conflict pre-resolved
          </p>
          <h1
            className="mt-6 max-w-4xl animate-fade-up text-5xl leading-[1.02] tracking-tightest md:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            Your event, solved.
            <br />
            <span className="text-gold-soft">Not searched.</span>
          </h1>
          <p
            className="mt-8 max-w-xl animate-fade-up text-lg font-light leading-relaxed text-dim"
            style={{ animationDelay: "160ms" }}
          >
            Submit one brief. The engine returns complete supplier teams — every
            member free on your date, the total inside your budget, every
            dependency between suppliers already resolved. You review teams, not
            search results.
          </p>

          <div
            className="mt-10 animate-fade-up"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/compose"
              className="inline-flex items-center gap-3 border border-gold bg-gold px-7 py-3.5 font-medium text-black transition-transform hover:-translate-y-1 focus-visible:-translate-y-1"
            >
              Compose an event
              <span aria-hidden className="font-mono">
                →
              </span>
            </Link>
          </div>
        </section>
      </div>

      <section className="border-t hairline-dark">
        <dl className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-[rgba(248,247,244,0.1)] px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
          {stats.map((s) => (
            <div key={s.label} className="py-10 md:px-8 md:first:pl-0">
              <dd className="font-mono text-4xl text-white">{s.value}</dd>
              <dt className="mt-3 max-w-[16ch] text-sm font-light text-grey">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t hairline-dark">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
              Composition, not search
            </p>
            <h2 className="mt-4 text-2xl tracking-tight">
              The engine composes teams that fit together
            </h2>
            <p className="mt-4 font-light leading-relaxed text-dim">
              A caterer that needs a kitchen is never paired with a venue that
              lacks one. Production that needs rigging is never sent somewhere it
              cannot rig. Capacity, access and dietary requirements are settled
              before a single team reaches you.
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
              Confirmed, not reviewed
            </p>
            <h2 className="mt-4 text-2xl tracking-tight">
              Delivery records, never self-reported
            </h2>
            <p className="mt-4 font-light leading-relaxed text-dim">
              Every supplier carries a record of the form{" "}
              <span className="font-mono text-sm text-dim">
                97% delivered as agreed · 41 verified events
              </span>{" "}
              — confirmed by clients after the event. No star ratings anywhere.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t hairline-dark">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-grey">
          <span className="font-display tracking-tight">EventOS</span>
          <span className="font-light">Composed, not searched.</span>
        </div>
      </footer>
    </main>
  );
}
