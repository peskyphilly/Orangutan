import Link from "next/link";
import { redirect } from "next/navigation";
import { getVendorSessionId } from "@/lib/vendor-session";
import { ListingForm } from "@/components/vendor/ListingForm";
import { createListingAction } from "../../actions";

export const dynamic = "force-dynamic";

export default function NewListingPage() {
  if (!getVendorSessionId()) redirect("/vendors/join");

  return (
    <main className="min-h-screen bg-white text-ink">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-6">
        <Link href="/vendors/dashboard" className="font-display text-lg tracking-tight">
          EventOS
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-grey">
          New listing
        </span>
      </header>

      <section className="mx-auto max-w-2xl px-6 pb-24 pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
          Add a listing
        </p>
        <h1 className="mt-4 text-4xl tracking-tight md:text-5xl">
          What are you offering?
        </h1>
        <p className="mt-4 max-w-xl font-light leading-relaxed text-grey">
          Pick a category and fill in what the engine needs to place you
          correctly. Only published listings are composed into client teams.
        </p>

        <ListingForm action={createListingAction} submitLabel="Save listing" />
      </section>
    </main>
  );
}
