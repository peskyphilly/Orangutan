"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { AuthFormState, joinBuyerAction } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-3 bg-ink px-7 py-3.5 font-medium text-white transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 disabled:opacity-60"
    >
      {pending ? "Creating account" : "Create account"}
      <span aria-hidden className="font-mono">
        →
      </span>
    </button>
  );
}

export default function BuyerJoinForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const [state, formAction] = useFormState(joinBuyerAction, {} as AuthFormState);

  return (
    <main className="min-h-screen bg-white text-ink">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-lg tracking-tight">
          EventOS
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-grey">
          Buyer account
        </span>
      </header>

      <section className="mx-auto max-w-2xl px-6 pb-24 pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
          Plan with an account
        </p>
        <h1 className="mt-4 text-4xl tracking-tight md:text-5xl">
          Create a buyer account
        </h1>
        <p className="mt-4 max-w-xl font-light leading-relaxed text-grey">
          Save your compositions and confirm teams securely. Email and password
          only.
        </p>

        <form action={formAction} className="mt-10 space-y-6">
          <input type="hidden" name="next" value={next} />

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              autoComplete="name"
              className="mt-3 w-full border border-light-line bg-white px-4 py-3 text-ink focus:border-gold"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              name="email"
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
              minLength={8}
              autoComplete="new-password"
              className="mt-3 w-full border border-light-line bg-white px-4 py-3 text-ink focus:border-gold"
            />
            <p className="mt-2 text-xs font-light text-grey">
              At least 8 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-ink"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
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
              href={`/account/signin?next=${encodeURIComponent(next)}`}
              className="text-sm font-light text-grey underline-offset-4 hover:underline"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
