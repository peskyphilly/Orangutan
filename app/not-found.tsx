import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-black text-white">
      <div className="gold-glow w-full">
        <div className="mx-auto max-w-2xl px-6 py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            Not found
          </p>
          <h1 className="mt-4 text-4xl tracking-tight">
            That composition has expired or never existed
          </h1>
          <p className="mt-4 font-light text-dim">
            Briefs are held server-side. Start a new one and the engine will
            compose fresh teams.
          </p>
          <Link
            href="/compose"
            className="mt-8 inline-flex items-center gap-2 bg-gold px-6 py-3 font-medium text-black transition-transform hover:-translate-y-1"
          >
            Compose an event
            <span aria-hidden className="font-mono">
              →
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
