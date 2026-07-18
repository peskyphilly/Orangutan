"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  BlackoutState,
  addBlackoutAction,
  removeBlackoutAction,
} from "@/app/vendors/actions";
import { prettyDate } from "@/lib/format";

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-ink px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-60"
    >
      {pending ? "Adding" : "Block date"}
    </button>
  );
}

export function BlackoutManager({
  supplierId,
  blackouts,
}: {
  supplierId: string;
  blackouts: { id: string; date: string }[];
}) {
  const [state, formAction] = useFormState(addBlackoutAction, {} as BlackoutState);
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="mt-14 border-t hairline-light pt-10">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
        Unavailable dates
      </h2>
      <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-grey">
        Block dates you cannot take. The engine will not place this listing in
        any team for those days. Confirmed bookings also block the date
        automatically.
      </p>

      <form action={formAction} className="mt-6 flex flex-wrap items-end gap-3">
        <input type="hidden" name="supplierId" value={supplierId} />
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="blackout-date" className="block text-sm font-medium text-ink">
            Date
          </label>
          <input
            id="blackout-date"
            name="date"
            type="date"
            required
            min={minDate}
            className="mt-2 w-full border border-light-line bg-white px-4 py-2.5 text-ink focus:border-gold"
          />
        </div>
        <AddButton />
      </form>

      {state.error ? (
        <p role="alert" className="mt-3 border-l-2 border-gold pl-3 text-sm text-ink">
          {state.error}
        </p>
      ) : null}

      {blackouts.length > 0 ? (
        <ul className="mt-6 divide-y divide-[#E6E3DB] border-y hairline-light">
          {blackouts.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <span className="font-mono text-sm text-ink">{prettyDate(b.date)}</span>
              <form action={removeBlackoutAction}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="supplierId" value={supplierId} />
                <button
                  type="submit"
                  className="text-sm font-light text-grey underline-offset-4 hover:text-ink hover:underline"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm font-light text-grey">
          No blocked dates yet. This listing is free on every future date until
          you block one or a booking lands.
        </p>
      )}
    </div>
  );
}
