"use server";

import { redirect } from "next/navigation";
import { Brief } from "@/lib/solver";
import {
  ConfirmConflictError,
  confirmComposition,
  createComposition,
} from "@/lib/composition";
import { getCurrentUser } from "@/lib/auth";
import { clientIp, enforceRateLimit } from "@/lib/rate-limit";

export interface ComposeState {
  error?: string;
}

export async function composeAction(
  _prev: ComposeState,
  formData: FormData
): Promise<ComposeState> {
  const user = await getCurrentUser();
  const limited = await enforceRateLimit(
    "compose",
    user?.id ?? clientIp()
  );
  if (limited) return { error: limited };

  const occasion = String(formData.get("occasion") ?? "");
  const date = String(formData.get("date") ?? "");
  const guests = Number(formData.get("guests"));
  const budget = Number(formData.get("budget"));
  const stepFree = formData.get("stepFree") === "on";
  const halal = formData.get("halal") === "on";
  const staging = formData.get("staging") === "on";
  const kitchen = formData.get("kitchen") === "on";
  const rigging = formData.get("rigging") === "on";

  if (!occasion) return { error: "Choose an occasion." };
  if (!date || Number.isNaN(Date.parse(date)))
    return { error: "Choose a date." };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(date) <= today)
    return { error: "The date must be in the future." };
  if (!Number.isFinite(guests) || guests < 10 || guests > 450)
    return { error: "Guests must be between 10 and 450." };
  if (!Number.isFinite(budget) || budget < 5000)
    return { error: "Budget must be at least £5,000." };

  const brief: Brief = {
    occasion,
    date,
    guests,
    budget,
    stepFree,
    halal,
    staging,
    kitchen,
    rigging,
  };

  const id = await createComposition(brief, user?.id ?? null);
  redirect(`/composing/${id}`);
}

export interface ConfirmState {
  error?: string;
}

export async function confirmAction(
  _prev: ConfirmState,
  formData: FormData
): Promise<ConfirmState> {
  const id = String(formData.get("compositionId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  if (!id || !teamId) return { error: "Missing composition or team." };

  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(`/teams/${encodeURIComponent(teamId)}?c=${id}`);
    redirect(`/account/signin?next=${next}`);
  }

  const limited = await enforceRateLimit("confirm", user.id);
  if (limited) return { error: limited };

  try {
    const reference = await confirmComposition(id, teamId, user.id);
    redirect(`/booked/${reference}`);
  } catch (err) {
    if (err instanceof ConfirmConflictError) return { error: err.message };
    throw err;
  }
}
