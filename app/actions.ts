"use server";

import { redirect } from "next/navigation";
import { Brief } from "@/lib/solver";
import { confirmComposition, createComposition } from "@/lib/composition";

export interface ComposeState {
  error?: string;
}

export async function composeAction(
  _prev: ComposeState,
  formData: FormData
): Promise<ComposeState> {
  const occasion = String(formData.get("occasion") ?? "");
  const date = String(formData.get("date") ?? "");
  const guests = Number(formData.get("guests"));
  const budget = Number(formData.get("budget"));
  const stepFree = formData.get("stepFree") === "on";
  const halal = formData.get("halal") === "on";
  const staging = formData.get("staging") === "on";
  const kitchen = formData.get("kitchen") === "on";
  const rigging = formData.get("rigging") === "on";

  // Server-side validation: date + guests + budget ≥ £5,000.
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

  const id = await createComposition(brief);
  redirect(`/composing/${id}`);
}

export async function confirmAction(formData: FormData): Promise<void> {
  const id = String(formData.get("compositionId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  if (!id || !teamId) throw new Error("Missing composition or team.");
  const reference = await confirmComposition(id, teamId);
  redirect(`/booked/${reference}`);
}
