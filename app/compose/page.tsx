"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { composeAction, ComposeState } from "../actions";
import { gbp } from "@/lib/format";

const OCCASIONS = [
  "Fundraising gala",
  "Wedding",
  "Corporate conference",
  "Product launch",
  "Private celebration",
];

const initialState: ComposeState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-3 bg-ink px-7 py-3.5 font-medium text-white transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Composing" : "Compose teams"}
      <span aria-hidden className="font-mono">
        →
      </span>
    </button>
  );
}

export default function ComposePage() {
  const [state, formAction] = useFormState(composeAction, initialState);
  const [budget, setBudget] = useState(42000);
  const [guests, setGuests] = useState(180);

  return (
    <main className="min-h-screen bg-white text-ink">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-lg tracking-tight">
          EventOS
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-grey">
          Brief
        </span>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-24 pt-8">
        <p className="animate-fade-up font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
          One brief in
        </p>
        <h1 className="mt-4 animate-fade-up text-4xl tracking-tight md:text-5xl">
          Describe the event once
        </h1>
        <p className="mt-4 max-w-xl animate-fade-up font-light leading-relaxed text-grey">
          You set the basics. We return complete supplier teams that already fit
          together. No vendor lists to sift through.
        </p>

        <form action={formAction} className="mt-12 space-y-10">
          {/* Occasion */}
          <div>
            <label
              htmlFor="occasion"
              className="block text-sm font-medium text-ink"
            >
              Occasion
            </label>
            <select
              id="occasion"
              name="occasion"
              defaultValue="Fundraising gala"
              className="mt-3 w-full border border-light-line bg-white px-4 py-3 text-ink focus:border-gold"
            >
              {OCCASIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Date + guests */}
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-ink">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                defaultValue="2026-11-14"
                min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                className="mt-3 w-full border border-light-line bg-white px-4 py-3 text-ink focus:border-gold"
              />
              <p className="mt-2 text-xs font-light text-grey">Future dates only.</p>
            </div>

            <div>
              <label
                htmlFor="guests"
                className="block text-sm font-medium text-ink"
              >
                Guests
              </label>
              <input
                id="guests"
                name="guests"
                type="number"
                required
                min={10}
                max={450}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="mt-3 w-full border border-light-line bg-white px-4 py-3 font-mono text-ink focus:border-gold"
              />
              <p className="mt-2 text-xs font-light text-grey">Between 10 and 450.</p>
            </div>
          </div>

          {/* Budget slider */}
          <div>
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="budget"
                className="block text-sm font-medium text-ink"
              >
                Budget
              </label>
              <output
                htmlFor="budget"
                className="font-mono text-2xl text-ink"
                aria-live="polite"
              >
                {gbp(budget)}
              </output>
            </div>
            <input
              id="budget"
              name="budget"
              type="range"
              min={10000}
              max={80000}
              step={500}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="mt-4 w-full accent-gold"
            />
            <div className="mt-2 flex justify-between font-mono text-[11px] text-grey">
              <span>{gbp(10000)}</span>
              <span>{gbp(80000)}</span>
            </div>
          </div>

          {/* Non-negotiables */}
          <fieldset>
            <legend className="text-sm font-medium text-ink">
              Non-negotiables
            </legend>
            <p className="mt-1 text-xs font-light text-grey">
              Tick what you must have. Any team that cannot meet it is left out.
            </p>
            <div className="mt-4 space-y-3">
              {[
                { name: "stepFree", label: "Step-free access", checked: true },
                {
                  name: "halal",
                  label: "Halal-capable catering",
                  checked: true,
                },
                {
                  name: "staging",
                  label: "Live staging & radio mics",
                  checked: true,
                },
                {
                  name: "kitchen",
                  label: "On-site kitchen",
                  checked: false,
                },
                {
                  name: "rigging",
                  label: "Venue with rigging points",
                  checked: false,
                },
              ].map((item) => (
                <label
                  key={item.name}
                  className="flex cursor-pointer items-center gap-3 border border-light-line px-4 py-3 transition-colors hover:border-gold-soft"
                >
                  <input
                    type="checkbox"
                    name={item.name}
                    defaultChecked={item.checked}
                    className="h-4 w-4 accent-gold"
                  />
                  <span className="text-sm text-ink">{item.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {state.error ? (
            <p
              role="alert"
              className="border-l-2 border-gold pl-3 text-sm text-ink"
            >
              {state.error}
            </p>
          ) : null}

          <div className="flex items-center gap-6 border-t hairline-light pt-8">
            <SubmitButton />
            <Link href="/" className="text-sm font-light text-grey underline-offset-4 hover:underline">
              Back
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
