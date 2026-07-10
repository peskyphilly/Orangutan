import type { Supplier } from "./solver";

// The supplier dataset. Reconstructed from the EventOS prototype brief to satisfy
// the constraint model in the spec: 8 venues, 8 caterers, 6 production, 6
// photographers, 6 florists (34 suppliers). Prices in GBP. Records are
// client-confirmed delivery figures (recPct = delivered-as-agreed %, recEvents =
// verified events) — never self-reported, never star ratings.
export const SUPPLIERS: Supplier[] = [
  // ── Venues ────────────────────────────────────────────────────────────────
  { id: "v-moorgate", name: "One Moorgate Place", category: "VENUE", price: 11500, capacity: 220, kitchen: true, rigging: false, stepFree: true, recPct: 97, recEvents: 41 },
  { id: "v-brewery", name: "The Brewery", category: "VENUE", price: 14000, capacity: 450, kitchen: true, rigging: true, stepFree: true, recPct: 95, recEvents: 78 },
  { id: "v-kingsplace", name: "Kings Place", category: "VENUE", price: 12500, capacity: 300, kitchen: true, rigging: true, stepFree: true, recPct: 96, recEvents: 52 },
  { id: "v-village", name: "Village Underground", category: "VENUE", price: 9000, capacity: 200, kitchen: false, rigging: true, stepFree: false, recPct: 92, recEvents: 33 },
  { id: "v-trinity", name: "Trinity House", category: "VENUE", price: 13000, capacity: 190, kitchen: true, rigging: false, stepFree: true, recPct: 98, recEvents: 60 },
  { id: "v-pallmall", name: "116 Pall Mall", category: "VENUE", price: 15500, capacity: 400, kitchen: true, rigging: true, stepFree: true, recPct: 96, recEvents: 71 },
  { id: "v-oval", name: "Oval Space", category: "VENUE", price: 8500, capacity: 250, kitchen: false, rigging: true, stepFree: true, recPct: 90, recEvents: 28 },
  { id: "v-ministry", name: "The Ministry", category: "VENUE", price: 10500, capacity: 180, kitchen: true, rigging: true, stepFree: true, recPct: 94, recEvents: 44 },

  // ── Caterers ──────────────────────────────────────────────────────────────
  { id: "c-maisonverte", name: "Maison Verte", category: "CATERER", perHead: 78, halal: true, needsKitchen: true, recPct: 97, recEvents: 41 },
  { id: "c-movingvenue", name: "Moving Venue", category: "CATERER", perHead: 72, halal: true, needsKitchen: true, recPct: 95, recEvents: 55 },
  { id: "c-alisonprice", name: "Alison Price", category: "CATERER", perHead: 85, halal: false, needsKitchen: true, recPct: 96, recEvents: 48 },
  { id: "c-rocket", name: "Rocket Food", category: "CATERER", perHead: 58, halal: true, needsKitchen: false, recPct: 91, recEvents: 30 },
  { id: "c-zafferano", name: "Zafferano", category: "CATERER", perHead: 68, halal: true, needsKitchen: false, recPct: 94, recEvents: 39 },
  { id: "c-bubble", name: "Bubble Food", category: "CATERER", perHead: 62, halal: false, needsKitchen: true, recPct: 93, recEvents: 36 },
  { id: "c-tandoor", name: "Tandoor Kitchen", category: "CATERER", perHead: 55, halal: true, needsKitchen: false, recPct: 92, recEvents: 27 },
  { id: "c-crichton", name: "The Admirable Crichton", category: "CATERER", perHead: 92, halal: false, needsKitchen: true, recPct: 98, recEvents: 64 },

  // ── Production ────────────────────────────────────────────────────────────
  { id: "p-whitelight", name: "White Light", category: "PRODUCTION", price: 7500, needsRigging: true, staging: true, recPct: 96, recEvents: 58 },
  { id: "p-encore", name: "Encore", category: "PRODUCTION", price: 5500, needsRigging: false, staging: true, recPct: 93, recEvents: 42 },
  { id: "p-pearce", name: "Pearce Hire", category: "PRODUCTION", price: 4800, needsRigging: false, staging: true, recPct: 91, recEvents: 35 },
  { id: "p-stageelectrics", name: "Stage Electrics", category: "PRODUCTION", price: 6200, needsRigging: true, staging: true, recPct: 94, recEvents: 47 },
  { id: "p-annavalley", name: "Anna Valley", category: "PRODUCTION", price: 8000, needsRigging: true, staging: true, recPct: 97, recEvents: 51 },
  { id: "p-slx", name: "SLX", category: "PRODUCTION", price: 5000, needsRigging: false, staging: false, recPct: 90, recEvents: 29 },

  // ── Photographers ─────────────────────────────────────────────────────────
  { id: "ph-aliki", name: "Aliki Studio", category: "PHOTOGRAPHER", price: 2600, recPct: 96, recEvents: 44 },
  { id: "ph-storylight", name: "Story & Light", category: "PHOTOGRAPHER", price: 2100, recPct: 93, recEvents: 31 },
  { id: "ph-fixation", name: "Fixation", category: "PHOTOGRAPHER", price: 3200, recPct: 97, recEvents: 58 },
  { id: "ph-rankin", name: "Rankin Creative", category: "PHOTOGRAPHER", price: 4500, recPct: 98, recEvents: 62 },
  { id: "ph-blank", name: "Blank Studio", category: "PHOTOGRAPHER", price: 1800, recPct: 91, recEvents: 26 },
  { id: "ph-thomas", name: "Thomas Alexander", category: "PHOTOGRAPHER", price: 2900, recPct: 95, recEvents: 40 },

  // ── Florists ──────────────────────────────────────────────────────────────
  { id: "f-mcqueens", name: "McQueens", category: "FLORIST", price: 2400, recPct: 97, recEvents: 53 },
  { id: "f-wildatheart", name: "Wild at Heart", category: "FLORIST", price: 1900, recPct: 95, recEvents: 41 },
  { id: "f-lavender", name: "Lavender Green", category: "FLORIST", price: 1600, recPct: 92, recEvents: 33 },
  { id: "f-larrywalshe", name: "Larry Walshe", category: "FLORIST", price: 3100, recPct: 98, recEvents: 60 },
  { id: "f-bloomwild", name: "Bloom & Wild Events", category: "FLORIST", price: 1400, recPct: 90, recEvents: 24 },
  { id: "f-gracethorn", name: "Grace & Thorn", category: "FLORIST", price: 2000, recPct: 94, recEvents: 37 },
];
