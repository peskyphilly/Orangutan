"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ListingCategory,
  ListingInput,
  addBlackout,
  createListing,
  deleteListing,
  getListing,
  removeBlackout,
  setEnquiryStatus,
  setListingStatus,
  updateListing,
} from "@/lib/vendors";
import { CATEGORY_FIELDS } from "@/lib/listing-fields";
import { getVendorSessionId } from "@/lib/vendor-session";
import { destroySession, registerVendor, signIn } from "@/lib/auth";

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
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password !== confirm) return { error: "Passwords do not match." };

  const result = await registerVendor({
    name,
    email: contactEmail,
    password,
  });
  if (result.error) return { error: result.error };
  redirect("/vendors/dashboard");
}

export async function signInVendorAction(
  _prev: JoinState,
  formData: FormData
): Promise<JoinState> {
  const email = String(formData.get("contactEmail") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const result = await signIn({ email, password });
  if (result.error) return { error: result.error };
  if (!result.user?.vendorId) {
    return {
      error: "This account is not a supplier account. Use the buyer sign-in instead.",
    };
  }
  redirect("/vendors/dashboard");
}

export async function signOutVendorAction(): Promise<void> {
  await destroySession();
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
  const price = num("price");
  const perHead = num("perHead");
  const capacity = num("capacity");

  if (category === "CATERER") {
    if (perHead == null || perHead <= 0) {
      return { error: "Set a price per head greater than £0." };
    }
  } else if (price == null || price <= 0) {
    return { error: "Set a price greater than £0." };
  }
  if (category === "VENUE" && (capacity == null || capacity < 10)) {
    return { error: "Set a capacity of at least 10 guests." };
  }

  return {
    name,
    category,
    price,
    perHead,
    capacity,
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
  const vendorId = await getVendorSessionId();
  if (!vendorId) redirect("/vendors/signin");

  const parsed = parseListing(formData);
  if ("error" in parsed) return { error: parsed.error };

  await createListing(vendorId, parsed);
  redirect("/vendors/dashboard");
}

export async function updateListingAction(
  _prev: ListingState,
  formData: FormData
): Promise<ListingState> {
  const vendorId = await getVendorSessionId();
  if (!vendorId) redirect("/vendors/signin");

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing listing." };

  const parsed = parseListing(formData);
  if ("error" in parsed) return { error: parsed.error };

  await updateListing(id, vendorId, parsed);
  redirect("/vendors/dashboard");
}

export async function toggleListingStatusAction(formData: FormData): Promise<void> {
  const vendorId = await getVendorSessionId();
  if (!vendorId) redirect("/vendors/signin");
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "published");
  if (!id) return;

  if (next === "published") {
    const listing = await getListing(id, vendorId);
    if (!listing) return;
    const pricing = CATEGORY_FIELDS[listing.category].pricing;
    const priced =
      pricing === "perHead"
        ? (listing.perHead ?? 0) > 0
        : (listing.price ?? 0) > 0;
    if (!priced) {
      // Keep as draft until the vendor sets a price on the edit form.
      revalidatePath("/vendors/dashboard");
      redirect(`/vendors/listings/${id}/edit?needPrice=1`);
    }
  }

  await setListingStatus(id, vendorId, next);
  revalidatePath("/vendors/dashboard");
}

export async function deleteListingAction(formData: FormData): Promise<void> {
  const vendorId = await getVendorSessionId();
  if (!vendorId) redirect("/vendors/join");
  const id = String(formData.get("id") ?? "");
  if (id) await deleteListing(id, vendorId);
  revalidatePath("/vendors/dashboard");
}

export async function respondEnquiryAction(formData: FormData): Promise<void> {
  const vendorId = await getVendorSessionId();
  if (!vendorId) redirect("/vendors/join");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && (status === "accepted" || status === "declined")) {
    await setEnquiryStatus(id, vendorId, status);
  }
  revalidatePath("/vendors/dashboard");
}

export interface BlackoutState {
  error?: string;
}

export async function addBlackoutAction(
  _prev: BlackoutState,
  formData: FormData
): Promise<BlackoutState> {
  const vendorId = await getVendorSessionId();
  if (!vendorId) redirect("/vendors/join");

  const supplierId = String(formData.get("supplierId") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!supplierId) return { error: "Missing listing." };

  const result = await addBlackout(supplierId, vendorId, date);
  if (result.error) return { error: result.error };

  revalidatePath(`/vendors/listings/${supplierId}/edit`);
  return {};
}

export async function removeBlackoutAction(
  _prev: BlackoutState,
  formData: FormData
): Promise<BlackoutState> {
  const vendorId = await getVendorSessionId();
  if (!vendorId) redirect("/vendors/signin");

  const id = String(formData.get("id") ?? "");
  const supplierId = String(formData.get("supplierId") ?? "");
  if (!id) return { error: "Missing blocked date." };

  const result = await removeBlackout(id, vendorId);
  if (supplierId) revalidatePath(`/vendors/listings/${supplierId}/edit`);
  if (result.error) return { error: result.error };
  return {};
}
