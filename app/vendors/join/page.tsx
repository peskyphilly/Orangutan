"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { JoinState, joinVendorAction } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-3 bg-ink px-7 py-3.5 font-medium text-white transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 disabled:opacity-60"
    >
      {pending ? "Setting up" : "Continue"}
      <span aria-hidden className="font-mono">
        →
      </span>
    </button>
  );
}

export default function VendorJoinPage() {
  const [state, formAction] = useFormState(joinVendorAction, {} as JoinState);

  return (
    <main className="min-h-screen bg-white text-ink">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-6">
        <Link href="/vendors" className="font-display text-lg tracking-tight">
          EventOS
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-grey">
          Supplier sign-up
        </span>
      </header>

      <section className="mx-auto max-w-2xl px-6 pb-24 pt-8">
        <p className="animate-fade-up font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
          List your services
        </p>
        <h1 className="mt-4 animate-fade-up text-4xl tracking-tight md:text-5xl">
          Two details and you&apos;re in
        </h1>
        <p className="mt-4 max-w-xl animate-fade-up font-light leading-relaxed text-grey">
          Your business name and an email. No password to set up. Sign back in
          any time with the same email.
        </p>

        <form action={formAction} className="mt-10 space-y-8">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink">
              Business name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. Maison Verte"
              className="mt-3 w-full border border-light-line bg-white px-4 py-3 text-ink focus:border-gold"
            />
          </div>

          <div>
            <label
              htmlFor="contactEmail"
              className="block text-sm font-medium text-ink"
            >
              Contact email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              required
              placeholder="you@business.com"
              className="mt-3 w-full border border-light-line bg-white px-4 py-3 text-ink focus:border-gold"
            />
            <p className="mt-2 text-xs font-light text-grey">
              Use the same email to sign back in later. That is all it takes. No
              password to remember.
            </p>
          </div>

          {state.error ? (
            <p role="alert" className="border-l-2 border-gold pl-3 text-sm text-ink">
              {state.error}
            </p>
          ) : null}

          <div className="flex items-center gap-6 border-t hairline-light pt-8">
            <SubmitButton />
            <Link
              href="/vendors"
              className="text-sm font-light text-grey underline-offset-4 hover:underline"
            >
              Back
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
