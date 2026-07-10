import { Figtree, IBM_Plex_Mono, Inter_Tight } from "next/font/google";

// Inter Tight — display. Figtree — body. IBM Plex Mono — data values only.
export const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const figtree = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-figtree",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});
