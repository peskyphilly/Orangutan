import Link from "next/link";
import { getVendorSessionId } from "@/lib/vendor-session";
import { getVendor } from "@/lib/vendors";

export const dynamic = "force-dynamic";

export default async function VendorLanding() {
  const vendorId = await getVendorSessionId();
  const vendor = vendorId ? await getVendor(vendorId) : null;

  const points = [
    {
      title: "Composed into teams, not buried in a list",
      body: "You are not one of fifty search results. The engine places your listing into complete teams when it fits the brief: venue, catering, production and more, matched around you.",
    },
    {
      title: "Only briefs you actually fit",
      body: "Capacity, budget, access, dietary and dependency checks run before you appear. The enquiries you get are ones you can genuinely deliver.",
    },
    {
      title: "Records earned, never bought",
      body: "Your standing comes from delivery confirmed by past clients after the event. Not stars, not self-reported scores. New listings start clean and build from there.",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="gold-glow">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/" className="font-display text-lg tracking-tightest">
            EventOS
          </Link>
          <nav className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.18em] text-dim">
            <span className="text-gold">For suppliers</span>
            {vendor ? (
              <Link href="/vendors/dashboard" className="hover:text-white">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/vendors/signin" className="hover:text-white">
                  Sign in
                </Link>
                <Link href="/vendors/join" className="hover:text-white">
                  Join
                </Link>
              </>
            )}
          </nav>
        </header>

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
          <p className="animate-fade-up font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            For venues, caterers, production, photographers and florists
          </p>
          <h1
            className="mt-6 max-w-3xl animate-fade-up text-5xl leading-[1.04] tracking-tightest md:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            Get placed in the right teams,{" "}
            <span className="text-gold-soft">for the right events.</span>
          </h1>
          <p
            className="mt-7 max-w-xl animate-fade-up text-lg font-light leading-relaxed text-dim"
            style={{ animationDelay: "160ms" }}
          >
            List once. When a client&apos;s brief matches what you offer, the
            engine composes you into a complete supplier team, already checked
            for fit. You receive enquiries you can deliver, not cold leads to
            chase.
          </p>
          <div className="mt-9 animate-fade-up" style={{ animationDelay: "240ms" }}>
            <Link
              href={vendor ? "/vendors/dashboard" : "/vendors/join"}
              className="inline-flex items-center gap-3 border border-gold bg-gold px-7 py-3.5 font-medium text-black transition-transform hover:-translate-y-1 focus-visible:-translate-y-1"
            >
              {vendor ? "Go to your dashboard" : "List your services"}
              <span aria-hidden className="font-mono">
                →
              </span>
            </Link>
          </div>
        </section>
      </div>

      <section className="border-t hairline-dark">
        <div className="mx-auto grid max-w-6xl gap-px bg-[rgba(248,247,244,0.08)] md:grid-cols-3">
          {points.map((p) => (
            <div key={p.title} className="bg-black p-8">
              <h2 className="text-xl tracking-tight">{p.title}</h2>
              <p className="mt-3 font-light leading-relaxed text-dim">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t hairline-dark">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-grey">
          <Link href="/" className="font-display tracking-tight">
            EventOS
          </Link>
          <span className="font-light">Composed, not searched.</span>
        </div>
      </footer>
    </main>
  );
}
