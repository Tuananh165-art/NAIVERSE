import { describe, expect, it } from "vitest";
import { createMapTileSources } from "./map-tiles";

describe("map tile providers", () => {
  it("uses the public OSM tile server by default", () => {
    expect(createMapTileSources()).toEqual([expect.objectContaining({
      id: "osm",
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    })]);
  });

  it("adds MapTiler as an automatic fallback when a key is configured", () => {
    const sources = createMapTileSources({ mapTilerKey: "public key" });
    expect(sources.map(({ id }) => id)).toEqual(["osm", "maptiler"]);
    expect(sources[1].url).toContain("key=public%20key");
    expect(sources[1].attribution).toContain("MapTiler");
    expect(sources[1].attribution).toContain("OpenStreetMap contributors");
  });

  it("allows MapTiler to be the primary provider and OSM to be its fallback", () => {
    expect(createMapTileSources({ provider: "maptiler", mapTilerKey: "test-key" }).map(({ id }) => id))
      .toEqual(["maptiler", "osm"]);
  });

  it("does not select MapTiler without a key", () => {
    expect(createMapTileSources({ provider: "maptiler" }).map(({ id }) => id)).toEqual(["osm"]);
  });
});
