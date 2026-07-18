"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ListingCategory,
  ListingInput,
  createListing,
  deleteListing,
  joinVendor,
  setEnquiryStatus,
  setListingStatus,
  updateListing,
} from "@/lib/vendors";
import {
  clearVendorSession,
  getVendorSessionId,
  setVendorSession,
} from "@/lib/vendor-session";

const CATEGORIES: ListingCategory[] = [
  "VENUE",
  "CATERER",
  "PRODUCTION",
  "PHOTOGRAPHER",
  "FLORIST",
];

export interface JoinState {
  error?: string;
}

export async function joinVendorAction(
  _prev: JoinState,
  formData: FormData
): Promise<JoinState> {
  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!name) return { error: "Enter your business name." };
  if (!contactEmail || !/^\S+@\S+\.\S+$/.test(contactEmail))
    return { error: "Enter a valid contact email." };

  const vendor = await joinVendor({ name, contactEmail, phone, city });
  setVendorSession(vendor.id);
  redirect("/vendors/dashboard");
}

export async function signOutVendorAction(): Promise<void> {
  clearVendorSession();
  redirect("/vendors");
}

function parseListing(formData: FormData): ListingInput | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "") as ListingCategory;
  if (!name) return { error: "Enter a listing name." };
  if (!CATEGORIES.includes(category)) return { error: "Choose a category." };

  const num = (key: string): number | null => {
    const raw = formData.get(key);
    if (raw === null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const flag = (key: string) => formData.get(key) === "on";
  const publish = formData.get("publish") === "on";

  return {
    name,
    category,
    price: num("price"),
    perHead: num("perHead"),
    capacity: num("capacity"),
    kitchen: flag("kitchen"),
    rigging: flag("rigging"),
    stepFree: flag("stepFree"),
    halal: flag("halal"),
    needsKitchen: flag("needsKitchen"),
    needsRigging: flag("needsRigging"),
    staging: flag("staging"),
    status: publish ? "published" : "draft",
  };
}

export interface ListingState {
  error?: string;
}

export async function createListingAction(
  _prev: ListingState,
  formData: FormData
): Promise<ListingState> {
  const vendorId = getVendorSessionId();
  if (!vendorId) redirect("/vendors/join");

  const parsed = parseListing(formData);
  if ("error" in parsed) return { error: parsed.error };

  await createListing(vendorId, parsed);
  redirect("/vendors/dashboard");
}

export async function updateListingAction(
  _prev: ListingState,
  formData: FormData
): Promise<ListingState> {
  const vendorId = getVendorSessionId();
  if (!vendorId) redirect("/vendors/join");

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing listing." };

  const parsed = parseListing(formData);
  if ("error" in parsed) return { error: parsed.error };

  await updateListing(id, vendorId, parsed);
  redirect("/vendors/dashboard");
}

export async function toggleListingStatusAction(formData: FormData): Promise<void> {
  const vendorId = getVendorSessionId();
  if (!vendorId) redirect("/vendors/join");
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "published");
  if (id) await setListingStatus(id, vendorId, next);
  revalidatePath("/vendors/dashboard");
}

export async function deleteListingAction(formData: FormData): Promise<void> {
  const vendorId = getVendorSessionId();
  if (!vendorId) redirect("/vendors/join");
  const id = String(formData.get("id") ?? "");
  if (id) await deleteListing(id, vendorId);
  revalidatePath("/vendors/dashboard");
}

export async function respondEnquiryAction(formData: FormData): Promise<void> {
  const vendorId = getVendorSessionId();
  if (!vendorId) redirect("/vendors/join");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && (status === "accepted" || status === "declined")) {
    await setEnquiryStatus(id, vendorId, status);
  }
  revalidatePath("/vendors/dashboard");
}
