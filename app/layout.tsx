import type { Metadata } from "next";
import "./globals.css";
import { figtree, interTight, plexMono } from "./fonts";

export const metadata: Metadata = {
  title: "EventOS. Your event, solved. Not searched.",
  description:
    "EventOS treats an event as a constraint-satisfaction problem. One brief in, complete supplier teams out. Every conflict pre-resolved.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${figtree.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
