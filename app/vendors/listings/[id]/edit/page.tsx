import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getVendorSessionId } from "@/lib/vendor-session";
import { getListing, listBlackouts } from "@/lib/vendors";
import { ListingForm } from "@/components/vendor/ListingForm";
import { BlackoutManager } from "@/components/vendor/BlackoutManager";
import { updateListingAction } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { needPrice?: string };
}) {
  const vendorId = await getVendorSessionId();
  if (!vendorId) redirect("/vendors/signin");

  const listing = await getListing(params.id, vendorId);
  if (!listing) notFound();
  const blackouts = await listBlackouts(listing.id, vendorId);
  const needPrice = searchParams?.needPrice === "1";

  return (
    <main className="min-h-screen bg-white text-ink">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-6">
        <Link href="/vendors/dashboard" className="font-display text-lg tracking-tight">
          EventOS
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-grey">
          Edit listing
        </span>
      </header>

      <section className="mx-auto max-w-2xl px-6 pb-24 pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
          Edit listing
        </p>
        <h1 className="mt-4 text-4xl tracking-tight md:text-5xl">{listing.name}</h1>

        {needPrice ? (
          <p
            role="alert"
            className="mt-6 border-l-2 border-gold pl-3 text-sm text-ink"
          >
            Set a price before publishing this listing.
          </p>
        ) : null}

        <ListingForm
          action={updateListingAction}
          submitLabel="Save price and details"
          initial={{
            id: listing.id,
            name: listing.name,
            category: listing.category,
            price: listing.price,
            perHead: listing.perHead,
            capacity: listing.capacity,
            kitchen: listing.kitchen,
            rigging: listing.rigging,
            stepFree: listing.stepFree,
            halal: listing.halal,
            needsKitchen: listing.needsKitchen,
            needsRigging: listing.needsRigging,
            staging: listing.staging,
            status: listing.status,
          }}
        />

        <BlackoutManager supplierId={listing.id} blackouts={blackouts} />
      </section>
    </main>
  );
}
