export type MapTileSource = {
  id: "osm" | "maptiler";
  url: string;
  attribution: string;
};

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
const MAPTILER_ATTRIBUTION = '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
const DEFAULT_OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function createMapTileSources(options: {
  provider?: string;
  osmUrl?: string;
  osmAttribution?: string;
  mapTilerKey?: string;
} = {}): MapTileSource[] {
  const osm: MapTileSource = {
    id: "osm",
    url: options.osmUrl || DEFAULT_OSM_URL,
    attribution: options.osmAttribution || OSM_ATTRIBUTION,
  };
  const mapTiler: MapTileSource | null = options.mapTilerKey
    ? {
        id: "maptiler",
        url: `https://api.maptiler.com/maps/streets-v4/256/{z}/{x}/{y}.png?key=${encodeURIComponent(options.mapTilerKey)}`,
        attribution: MAPTILER_ATTRIBUTION,
      }
    : null;

  return options.provider === "maptiler" && mapTiler
    ? [mapTiler, osm]
    : mapTiler
      ? [osm, mapTiler]
      : [osm];
}
