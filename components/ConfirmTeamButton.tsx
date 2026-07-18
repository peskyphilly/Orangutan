"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { ConfirmState, confirmAction } from "@/app/actions";

function SubmitButton({ loggedIn }: { loggedIn: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-3 bg-gold px-7 py-3.5 font-medium text-black transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 disabled:opacity-60"
    >
      {pending
        ? "Confirming"
        : loggedIn
          ? "Confirm this team"
          : "Sign in to confirm"}
      <span aria-hidden className="font-mono">
        →
      </span>
    </button>
  );
}

export function ConfirmTeamButton({
  compositionId,
  teamId,
  loggedIn,
  signInHref,
}: {
  compositionId: string;
  teamId: string;
  loggedIn: boolean;
  signInHref: string;
}) {
  const [state, formAction] = useFormState(confirmAction, {} as ConfirmState);

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Link
          href={signInHref}
          className="inline-flex items-center gap-3 bg-gold px-7 py-3.5 font-medium text-black transition-transform hover:-translate-y-1"
        >
          Sign in to confirm
          <span aria-hidden className="font-mono">
            →
          </span>
        </Link>
        <p className="text-sm font-light text-dim">
          You need a buyer account before confirming a team.{" "}
          <Link href={signInHref.replace("/signin", "/join")} className="underline">
            Create one
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <form action={formAction}>
        <input type="hidden" name="compositionId" value={compositionId} />
        <input type="hidden" name="teamId" value={teamId} />
        <SubmitButton loggedIn={loggedIn} />
      </form>
      {state.error ? (
        <p role="alert" className="max-w-md border-l-2 border-gold pl-3 text-sm text-dim">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
