import { Suspense } from "react";
import BuyerSignInForm from "./form";

export default function BuyerSignInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white px-6 py-24 text-ink">
          Loading…
        </main>
      }
    >
      <BuyerSignInForm />
    </Suspense>
  );
}
