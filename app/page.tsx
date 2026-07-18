import Link from "next/link";
import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";

export const dynamic = "force-dynamic";

// A real composed team (the Recommended result for the demo brief), shown as the
// hero visual so the landing page demonstrates the product rather than describing it.
const PREVIEW = {
  tag: "Recommended",
  total: 41840,
  under: 160,
  rows: [
    { role: "Venue", name: "The Brewery", price: 14000 },
    { role: "Catering", name: "Zafferano", price: 12240 },
    { role: "Production", name: "Anna Valley", price: 8000 },
    { role: "Photography", name: "Rankin Creative", price: 4500 },
    { role: "Flowers", name: "Larry Walshe", price: 3100 },
  ],
};

function TeamPreview() {
  return (
    <div className="relative">
      {/* stacked cards behind, implying more than one solved team */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-4 translate-y-4 rounded-sm border border-dark-line bg-panel/60"
      />
      <div
        aria-hidden
        className="absolute inset-0 translate-x-2 translate-y-2 rounded-sm border border-dark-line bg-panel/80"
      />
      <div className="relative rounded-sm border border-dark-line bg-panel p-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">
            {PREVIEW.tag}
          </span>
          <span className="font-mono text-[11px] text-dim">
            {gbp(PREVIEW.under)} under budget
          </span>
        </div>

        <p className="mt-4 font-mono text-3xl text-white">{gbp(PREVIEW.total)}</p>

        <ul className="mt-5 divide-y divide-[rgba(248,247,244,0.1)] border-y hairline-dark">
          {PREVIEW.rows.map((r) => (
            <li key={r.role} className="flex items-baseline justify-between py-2.5">
              <span className="text-sm text-white">
                <span className="text-dim">{r.role}</span>
                <span className="mx-2 text-[rgba(248,247,244,0.25)]">·</span>
                {r.name}
              </span>
              <span className="font-mono text-sm text-white">{gbp(r.price)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center gap-2.5">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
          <span className="text-xs font-light text-dim">
            Every conflict resolved before you saw it
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const supplierCount = await prisma.supplier.count();

  const stats = [
    { value: String(supplierCount), label: "suppliers ready to match" },
    { value: "<2s", label: "to build a full team" },
    { value: "100%", label: "records confirmed by clients" },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="gold-glow">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="font-display text-lg tracking-tightest">EventOS</span>
          <Link
            href="/vendors"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim transition-colors hover:text-white"
          >
            For suppliers →
          </Link>
        </header>

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left: copy */}
            <div>
              <p className="animate-fade-up font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
                For galas, weddings, conferences and launches
              </p>
              <h1
                className="mt-6 max-w-2xl animate-fade-up text-5xl leading-[1.04] tracking-tightest md:text-6xl"
                style={{ animationDelay: "80ms" }}
              >
                Plan your whole event{" "}
                <span className="text-gold-soft">in minutes.</span>
              </h1>
              <p
                className="mt-7 max-w-xl animate-fade-up text-lg font-light leading-relaxed text-dim"
                style={{ animationDelay: "160ms" }}
              >
                Tell us what you&apos;re planning, when it&apos;s happening and
                what you want to spend, and we&apos;ll find complete supplier
                teams that fit. All you have to do is choose one.
              </p>

              <div
                className="mt-9 animate-fade-up"
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
            </div>

            {/* Right: live team preview */}
            <div
              className="animate-fade-up"
              style={{ animationDelay: "320ms" }}
            >
              <TeamPreview />
            </div>
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
              How it works
            </p>
            <h2 className="mt-4 text-2xl tracking-tight">
              Only teams that actually fit together
            </h2>
            <p className="mt-4 font-light leading-relaxed text-dim">
              A caterer that needs a kitchen is never paired with a venue that
              lacks one. Production that needs rigging is never sent somewhere it
              cannot rig. Guest count, access and dietary needs are checked
              before you see a single team.
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
              The records
            </p>
            <h2 className="mt-4 text-2xl tracking-tight">
              Real delivery records, not star ratings
            </h2>
            <p className="mt-4 font-light leading-relaxed text-dim">
              Every supplier shows a record like{" "}
              <span className="font-mono text-sm text-dim">
                97% delivered as agreed · 41 verified events
              </span>
              . Past clients confirm it after the event. No self-reported scores.
              No star ratings.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t hairline-dark">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-grey">
          <span className="font-display tracking-tight">EventOS</span>
          <span className="font-light">One brief. A complete event.</span>
        </div>
      </footer>
    </main>
  );
}
