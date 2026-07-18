"use server";

import { redirect } from "next/navigation";
import { destroySession, registerBuyer, signIn } from "@/lib/auth";

export interface AuthFormState {
  error?: string;
}

function safeNext(raw: FormDataEntryValue | null): string {
  const next = String(raw ?? "").trim();
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/account";
}

export async function joinBuyerAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const next = safeNext(formData.get("next"));

  if (password !== confirm) return { error: "Passwords do not match." };

  const result = await registerBuyer({ name, email, password });
  if (result.error) return { error: result.error };
  redirect(next);
}

export async function signInBuyerAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const result = await signIn({ email, password });
  if (result.error) return { error: result.error };
  if (result.user?.vendorId && next === "/account") {
    redirect("/vendors/dashboard");
  }
  redirect(next);
}

export async function signOutBuyerAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
