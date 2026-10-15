import type { Place } from "@/lib/catalog";

export type PriceLine = {
  placeId: string;
  amountVnd: number | null;
  status: "verified" | "historical" | "conflicting" | "unknown";
  source: string | null;
};

/** Missing prices stay null; absence of data is never counted as a zero-cost service. */
export function priceBreakdown(places: Place[]): {
  knownSubtotalVnd: number | null;
  unknownCount: number;
  lines: PriceLine[];
} {
  const lines = places.map((place) => ({
    placeId: place.id,
    amountVnd: null,
    status: "unknown" as const,
    source: place.evidence.find((item) => item.url)?.url ?? null,
  }));
  return { knownSubtotalVnd: null, unknownCount: lines.length, lines };
}
