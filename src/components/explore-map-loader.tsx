"use client";

import dynamic from "next/dynamic";
import type { Place } from "@/lib/catalog";
import type { RouteResult } from "@/lib/route";

const ExploreMap = dynamic(() => import("@/components/explore-map").then((module) => module.ExploreMap), {
  ssr: false,
  loading: () => <div className="map map-loading" aria-label="Loading map">Map preview</div>,
});

export function ExploreMapLoader({ places, route }: { places: Place[]; route?: RouteResult | null }) {
  return <ExploreMap places={places} route={route} />;
}
