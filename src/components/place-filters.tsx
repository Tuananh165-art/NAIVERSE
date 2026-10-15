"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Place, PlaceCategory } from "@/lib/catalog";
import { PlaceCard } from "@/components/place-card";
import { placeMatches } from "@/lib/catalog";

const categories: (PlaceCategory | "all")[] = ["all", "nature", "culture", "family", "food", "stay", "experience"];

export function PlaceFilters({ places, showMapLink = true }: { places: Place[]; showMapLink?: boolean }) {
  const t = useTranslations("catalog");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const filtered = useMemo(() => places.filter((place) => (category === "all" || place.category === category) && (!query || placeMatches(place, query))), [places, category, query]);

  return (
    <>
      <div className="place-toolbar">
        <label className="search-field"><Search size={16} /><span className="sr-only">{t("search")}</span><input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} /></label>
        <a className="button button-secondary" href={showMapLink ? "#map" : "/places#map"}><SlidersHorizontal size={15} />{t("map")}</a>
      </div>
      <div className="chip-row" role="group" aria-label={t("all")}>
        {categories.map((item) => <button className="chip" aria-pressed={category === item} key={item} type="button" onClick={() => setCategory(item)}>{item === "all" ? t("all") : t(item)}</button>)}
      </div>
      <p className="form-hint" aria-live="polite">{filtered.length} {useTranslations("common")("demo")}</p>
      {filtered.length
        ? <div className="place-grid" style={{ marginTop: 17 }}>{filtered.map((place) => <PlaceCard key={place.id} place={place} />)}</div>
        : <div className="empty-state" style={{ marginTop: 20 }}>{t("noResults")}</div>}
    </>
  );
}
