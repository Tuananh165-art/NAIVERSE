export type CoveragePlace = {
  id: string;
  name: string;
  name_en: string;
  is_group: boolean;
  latitude: number | null;
  longitude: number | null;
  coordinate_precision: string | null;
};

export type CoverageMedia = { place_id: string; approved: boolean };
export type CoverageHours = { place_id: string; status: string; approved: boolean };
export type CoveragePrice = { place_id: string; status: string; approved: boolean };

export type PlaceCoverage = {
  id: string;
  name: string;
  nameEn: string;
  gaps: Array<"photo" | "entrance" | "hours" | "price">;
};

export function getCatalogEvidenceCoverage(
  places: CoveragePlace[],
  media: CoverageMedia[],
  hours: CoverageHours[],
  prices: CoveragePrice[],
) {
  const concretePlaces = places.filter((place) => !place.is_group);
  const approvedMedia = new Set(media.filter((record) => record.approved).map((record) => record.place_id));
  const entranceVerified = new Set(concretePlaces
    .filter((place) => place.latitude !== null && place.longitude !== null && place.coordinate_precision === "entrance_verified")
    .map((place) => place.id));
  const approvedHours = new Set(hours.filter((record) => record.approved).map((record) => record.place_id));
  const verifiedHours = new Set(hours.filter((record) => record.approved && record.status === "verified").map((record) => record.place_id));
  const approvedPrices = new Set(prices.filter((record) => record.approved).map((record) => record.place_id));
  const verifiedPrices = new Set(prices.filter((record) => record.approved && record.status === "verified").map((record) => record.place_id));

  const incomplete = places.map((place): PlaceCoverage => {
    const gaps: PlaceCoverage["gaps"] = [];
    if (!approvedMedia.has(place.id)) gaps.push("photo");
    if (!place.is_group && !entranceVerified.has(place.id)) gaps.push("entrance");
    if (!approvedHours.has(place.id)) gaps.push("hours");
    if (!approvedPrices.has(place.id)) gaps.push("price");
    return { id: place.id, name: place.name, nameEn: place.name_en, gaps };
  }).filter((place) => place.gaps.length > 0);

  return {
    places: places.length,
    photos: { covered: places.filter((place) => approvedMedia.has(place.id)).length, total: places.length },
    entrances: { covered: entranceVerified.size, total: concretePlaces.length },
    hours: {
      covered: approvedHours.size,
      verified: verifiedHours.size,
      total: places.length,
    },
    prices: {
      covered: approvedPrices.size,
      verified: verifiedPrices.size,
      total: places.length,
    },
    incomplete,
  };
}
