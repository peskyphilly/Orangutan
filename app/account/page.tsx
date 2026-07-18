import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listCompositionsForUser } from "@/lib/composition";
import { gbp, prettyDate } from "@/lib/format";
import { signOutBuyerAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/signin?next=/account");

  const compositions = await listCompositionsForUser(user.id);

  return (
    <main className="min-h-screen bg-white text-ink">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-lg tracking-tight">
          EventOS
        </Link>
        <div className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.18em] text-grey">
          <span className="hidden sm:inline">{user.email}</span>
          <form action={signOutBuyerAction}>
            <button type="submit" className="hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-24 pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
          Your account
        </p>
        <h1 className="mt-4 text-4xl tracking-tight md:text-5xl">
          {user.name ?? "Your events"}
        </h1>
        <p className="mt-3 font-light text-grey">
          Compositions and bookings tied to this account.
        </p>

        <div className="mt-8">
          <Link
            href="/compose"
            className="inline-flex items-center gap-3 bg-ink px-6 py-3 font-medium text-white transition-transform hover:-translate-y-1"
          >
            Plan an event
            <span aria-hidden className="font-mono">
              →
            </span>
          </Link>
        </div>

        {compositions.length === 0 ? (
          <p className="mt-14 font-light text-grey">
            No compositions yet. Start a brief and your teams will show up here.
          </p>
        ) : (
          <ul className="mt-14 divide-y divide-[#E6E3DB] border-y hairline-light">
            {compositions.map((c) => {
              const href =
                c.status === "confirmed" && c.reference
                  ? `/booked/${c.reference}`
                  : `/teams?c=${c.id}`;
              return (
                <li key={c.id} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink">{c.brief.occasion}</p>
                    <p className="mt-1 font-mono text-xs text-grey">
                      {prettyDate(c.brief.date)} · {c.brief.guests} guests ·{" "}
                      {gbp(c.brief.budget)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold">
                      {c.status === "confirmed"
                        ? c.reference ?? "confirmed"
                        : "composed"}
                    </span>
                    <Link
                      href={href}
                      className="text-sm font-medium text-ink underline-offset-4 hover:underline"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
