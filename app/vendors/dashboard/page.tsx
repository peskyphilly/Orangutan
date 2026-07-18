import Link from "next/link";
import { redirect } from "next/navigation";
import { getVendorSessionId } from "@/lib/vendor-session";
import { getVendor, listEnquiries, listListings } from "@/lib/vendors";
import { CATEGORY_LABEL } from "@/lib/listing-fields";
import { gbp, prettyDate } from "@/lib/format";
import {
  deleteListingAction,
  respondEnquiryAction,
  signOutVendorAction,
  toggleListingStatusAction,
} from "../actions";

export const dynamic = "force-dynamic";

function priceLabel(l: {
  category: keyof typeof CATEGORY_LABEL;
  price: number | null;
  perHead: number | null;
}): string {
  if (l.category === "CATERER")
    return l.perHead != null ? `${gbp(l.perHead)} / head` : "n/a";
  return l.price != null ? gbp(l.price) : "n/a";
}

export default async function VendorDashboard() {
  const vendorId = await getVendorSessionId();
  if (!vendorId) redirect("/vendors/signin");
  const vendor = await getVendor(vendorId);
  if (!vendor) redirect("/vendors/signin");

  const listings = await listListings(vendorId);
  const published = listings.filter((l) => l.status === "published").length;
  const enquiries = await listEnquiries(vendorId);
  const newEnquiries = enquiries.filter((e) => e.status === "new").length;

  return (
    <main className="min-h-screen bg-white text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-lg tracking-tight">
          EventOS
        </Link>
        <div className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.18em] text-grey">
          <span className="hidden sm:inline">{vendor.name}</span>
          <form action={signOutVendorAction}>
            <button type="submit" className="hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
              Supplier dashboard
            </p>
            <h1 className="mt-4 text-4xl tracking-tight md:text-5xl">
              {vendor.name}
            </h1>
            <p className="mt-3 font-mono text-xs text-grey">
              {listings.length} {listings.length === 1 ? "listing" : "listings"} ·{" "}
              {published} published · {newEnquiries} new{" "}
              {newEnquiries === 1 ? "enquiry" : "enquiries"}
            </p>
          </div>
          <Link
            href="/vendors/listings/new"
            className="inline-flex items-center gap-3 self-start bg-ink px-6 py-3 font-medium text-white transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 sm:self-auto"
          >
            Add a listing
            <span aria-hidden className="font-mono">
              →
            </span>
          </Link>
        </div>

        {/* Enquiries: booking loop when a buyer confirms a team with your listing */}
        {enquiries.length > 0 ? (
          <div className="mt-14">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
              Enquiries
            </h2>
            <ul className="mt-5 divide-y divide-[#E6E3DB] border-y hairline-light">
              {enquiries.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium text-ink">{e.listingName}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-grey">
                        {e.role}
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                          e.status === "new"
                            ? "text-gold"
                            : e.status === "accepted"
                              ? "text-ink"
                              : "text-grey"
                        }`}
                      >
                        {e.status === "new"
                          ? "New"
                          : e.status === "accepted"
                            ? "Accepted"
                            : "Declined"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-grey">
                      {e.occasion} · {prettyDate(e.eventDate)} · {e.guests} guests ·{" "}
                      {gbp(e.amount)} · ref {e.reference}
                    </p>
                  </div>

                  {e.status === "new" ? (
                    <div className="flex items-center gap-3">
                      <form action={respondEnquiryAction}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="status" value="accepted" />
                        <button
                          type="submit"
                          className="border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white"
                        >
                          Accept
                        </button>
                      </form>
                      <form action={respondEnquiryAction}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="status" value="declined" />
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-light text-grey underline-offset-4 hover:text-ink hover:underline"
                        >
                          Decline
                        </button>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {listings.length === 0 ? (
          <div className="mt-12 max-w-2xl border-l-2 border-gold pl-6">
            <h2 className="text-2xl tracking-tight">No listings yet</h2>
            <p className="mt-3 font-light leading-relaxed text-grey">
              Add your first listing and, once published, the engine can compose
              it into client teams whenever it fits the brief.
            </p>
          </div>
        ) : (
          <ul className="mt-12 divide-y divide-[#E6E3DB] border-y hairline-light">
            {listings.map((l) => {
              const isPublished = l.status === "published";
              return (
                <li
                  key={l.id}
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-ink">{l.name}</span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                          isPublished ? "text-gold" : "text-grey"
                        }`}
                      >
                        {isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-grey">
                      {CATEGORY_LABEL[l.category]} · {priceLabel(l)} ·{" "}
                      {l.recEvents > 0
                        ? `${l.recPct}% delivered as agreed · ${l.recEvents} verified events`
                        : "New, no record yet"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.14em]">
                    <Link
                      href={`/vendors/listings/${l.id}/edit`}
                      className="text-grey underline-offset-4 hover:text-ink hover:underline"
                    >
                      Edit
                    </Link>
                    <form action={toggleListingStatusAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <input
                        type="hidden"
                        name="next"
                        value={isPublished ? "draft" : "published"}
                      />
                      <button
                        type="submit"
                        className="text-grey underline-offset-4 hover:text-ink hover:underline"
                      >
                        {isPublished ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <form action={deleteListingAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <button
                        type="submit"
                        className="text-grey underline-offset-4 hover:text-ink hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
