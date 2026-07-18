"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  CATEGORIES,
  CATEGORY_FIELDS,
  CATEGORY_LABEL,
  ListingCategory,
} from "@/lib/listing-fields";
import { ListingState } from "@/app/vendors/actions";

export interface ListingInitial {
  id?: string;
  name?: string;
  category?: ListingCategory;
  price?: number | null;
  perHead?: number | null;
  capacity?: number | null;
  kitchen?: boolean | null;
  rigging?: boolean | null;
  stepFree?: boolean | null;
  halal?: boolean | null;
  needsKitchen?: boolean | null;
  needsRigging?: boolean | null;
  staging?: boolean | null;
  status?: string;
}

const NUMBER_VALUE: Record<string, (i: ListingInitial) => number | null | undefined> =
  {
    price: (i) => i.price,
    capacity: (i) => i.capacity,
    perHead: (i) => i.perHead,
  };

const FLAG_VALUE: Record<string, (i: ListingInitial) => boolean | null | undefined> =
  {
    kitchen: (i) => i.kitchen,
    rigging: (i) => i.rigging,
    stepFree: (i) => i.stepFree,
    halal: (i) => i.halal,
    needsKitchen: (i) => i.needsKitchen,
    needsRigging: (i) => i.needsRigging,
    staging: (i) => i.staging,
  };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-3 bg-ink px-7 py-3.5 font-medium text-white transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 disabled:opacity-60"
    >
      {pending ? "Saving" : label}
      <span aria-hidden className="font-mono">
        →
      </span>
    </button>
  );
}

export function ListingForm({
  action,
  initial = {},
  submitLabel,
}: {
  action: (prev: ListingState, formData: FormData) => Promise<ListingState>;
  initial?: ListingInitial;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, {} as ListingState);
  const [category, setCategory] = useState<ListingCategory>(
    initial.category ?? "VENUE"
  );
  const spec = CATEGORY_FIELDS[category];
  const isNew = !initial.id;

  return (
    <form action={formAction} className="mt-10 space-y-8">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink">
          Listing name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={initial.name ?? ""}
          placeholder="e.g. The Brewery"
          className="mt-3 w-full border border-light-line bg-white px-4 py-3 text-ink focus:border-gold"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-ink">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ListingCategory)}
          className="mt-3 w-full border border-light-line bg-white px-4 py-3 text-ink focus:border-gold"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      {spec.numbers.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-medium text-ink">Your pricing</legend>
          <p className="mt-1 text-xs font-light text-grey">
            This is what buyers see in composed teams. You can change it any
            time before a booking locks the date.
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {spec.numbers.map((n) => (
              <div key={n.name}>
                <label
                  htmlFor={n.name}
                  className="block text-sm font-medium text-ink"
                >
                  {n.label}
                </label>
                <input
                  id={n.name}
                  name={n.name}
                  type="number"
                  min={1}
                  step={1}
                  required
                  defaultValue={NUMBER_VALUE[n.name]?.(initial) ?? ""}
                  placeholder={n.name === "perHead" ? "e.g. 68" : "e.g. 14000"}
                  className="mt-3 w-full border border-light-line bg-white px-4 py-3 font-mono text-ink focus:border-gold"
                />
              </div>
            ))}
          </div>
        </fieldset>
      ) : null}

      {spec.flags.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-medium text-ink">Capabilities</legend>
          <div className="mt-4 space-y-3">
            {spec.flags.map((f) => {
              const initialFlag = FLAG_VALUE[f.name]?.(initial);
              const defaultHalalOn =
                isNew && category === "CATERER" && f.name === "halal";
              return (
                <label
                  key={f.name}
                  className="flex cursor-pointer items-center gap-3 border border-light-line px-4 py-3 transition-colors hover:border-gold-soft"
                >
                  <input
                    type="checkbox"
                    name={f.name}
                    defaultChecked={
                      initialFlag == null
                        ? defaultHalalOn
                        : Boolean(initialFlag)
                    }
                    className="h-4 w-4 accent-gold"
                  />
                  <span className="text-sm text-ink">{f.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <label className="flex cursor-pointer items-center gap-3 border-l-2 border-gold bg-[#FBFAF7] px-4 py-3">
        <input
          type="checkbox"
          name="publish"
          defaultChecked={isNew ? true : initial.status === "published"}
          className="h-4 w-4 accent-gold"
        />
        <span className="text-sm text-ink">
          Publish: make this listing available to the composition engine
        </span>
      </label>

      {state.error ? (
        <p role="alert" className="border-l-2 border-gold pl-3 text-sm text-ink">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-6 border-t hairline-light pt-8">
        <SubmitButton label={submitLabel} />
        <Link
          href="/vendors/dashboard"
          className="text-sm font-light text-grey underline-offset-4 hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
