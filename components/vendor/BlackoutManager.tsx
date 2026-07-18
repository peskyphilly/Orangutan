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

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm font-light text-grey underline-offset-4 hover:text-ink hover:underline disabled:opacity-60"
    >
      {pending ? "Removing" : "Remove"}
    </button>
  );
}

export function BlackoutManager({
  supplierId,
  blackouts,
}: {
  supplierId: string;
  blackouts: { id: string; date: string; reason: string }[];
}) {
  const [addState, addAction] = useFormState(addBlackoutAction, {} as BlackoutState);
  const [removeState, removeAction] = useFormState(
    removeBlackoutAction,
    {} as BlackoutState
  );
  const minDate = new Date().toISOString().slice(0, 10);
  const error = addState.error || removeState.error;

  return (
    <div className="mt-14 border-t hairline-light pt-10">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
        Unavailable dates
      </h2>
      <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-grey">
        Block dates you cannot take. Confirmed bookings also lock the date
        automatically, and those cannot be cleared here.
      </p>

      <form action={addAction} className="mt-6 flex flex-wrap items-end gap-3">
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

      {error ? (
        <p role="alert" className="mt-3 border-l-2 border-gold pl-3 text-sm text-ink">
          {error}
        </p>
      ) : null}

      {blackouts.length > 0 ? (
        <ul className="mt-6 divide-y divide-[#E6E3DB] border-y hairline-light">
          {blackouts.map((b) => {
            const locked = b.reason === "booking";
            return (
              <li
                key={b.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <span className="font-mono text-sm text-ink">
                    {prettyDate(b.date)}
                  </span>
                  <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.14em] text-grey">
                    {locked ? "Confirmed booking" : "You blocked"}
                  </span>
                </div>
                {locked ? (
                  <span className="text-sm font-light text-grey">Locked</span>
                ) : (
                  <form action={removeAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="supplierId" value={supplierId} />
                    <RemoveButton />
                  </form>
                )}
              </li>
            );
          })}
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
