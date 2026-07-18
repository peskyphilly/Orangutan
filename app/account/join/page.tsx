import { Suspense } from "react";
import BuyerJoinForm from "./form";

export default function BuyerJoinPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white px-6 py-24 text-ink">
          Loading…
        </main>
      }
    >
      <BuyerJoinForm />
    </Suspense>
  );
}
