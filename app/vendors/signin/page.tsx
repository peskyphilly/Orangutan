"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { JoinState, signInVendorAction } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-3 bg-ink px-7 py-3.5 font-medium text-white transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 disabled:opacity-60"
    >
      {pending ? "Signing in" : "Sign in"}
      <span aria-hidden className="font-mono">
        →
      </span>
    </button>
  );
}

export default function VendorSignInPage() {
  const [state, formAction] = useFormState(signInVendorAction, {} as JoinState);

  return (
    <main className="min-h-screen bg-white text-ink">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-6">
        <Link href="/vendors" className="font-display text-lg tracking-tight">
          EventOS
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-grey">
          Supplier sign-in
        </span>
      </header>

      <section className="mx-auto max-w-2xl px-6 pb-24 pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
          Welcome back
        </p>
        <h1 className="mt-4 text-4xl tracking-tight md:text-5xl">
          Sign in to your supplier account
        </h1>
        <p className="mt-4 max-w-xl font-light leading-relaxed text-grey">
          Use the email and password you set when you listed your services.
        </p>

        <form action={formAction} className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="contactEmail"
              className="block text-sm font-medium text-ink"
            >
              Email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              required
              autoComplete="email"
              className="mt-3 w-full border border-light-line bg-white px-4 py-3 text-ink focus:border-gold"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-ink"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-3 w-full border border-light-line bg-white px-4 py-3 text-ink focus:border-gold"
            />
          </div>

          {state.error ? (
            <p role="alert" className="border-l-2 border-gold pl-3 text-sm text-ink">
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-6 border-t hairline-light pt-8">
            <SubmitButton />
            <Link
              href="/vendors/join"
              className="text-sm font-light text-grey underline-offset-4 hover:underline"
            >
              New here? Create an account
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
