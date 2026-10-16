import "server-only";
import type { Place } from "@/lib/catalog";

export type RouteResult = { distanceKm: number; durationMinutes: number; geometry: [number, number][] };
export type RoutePreference = "fastest" | "shortest";
export type RouteStop = Pick<Place, "name" | "latitude" | "longitude">;
export type RouteObjective = "duration" | "distance";
export type RouteMatrix = { durations: Array<Array<number | null>>; distances: Array<Array<number | null>> };
export type RouteOptimization = { order: number[]; estimatedDistanceKm: number; estimatedDurationMinutes: number; objective: RouteObjective };

/** Exhaustively finds the best matrix order for <=8 stops while keeping the first and last stops fixed. */
export function optimizeRouteOrder(matrix: RouteMatrix, objective: RouteObjective): RouteOptimization | null {
  const size = matrix.durations.length;
  if (size < 2 || size > 8 || matrix.distances.length !== size) return null;
  if (matrix.durations.some((row) => row.length !== size) || matrix.distances.some((row) => row.length !== size)) return null;

  let bestOrder: number[] | null = null;
  let bestCost = Number.POSITIVE_INFINITY;
  let bestDistance = 0;
  let bestDuration = 0;
  const interior = Array.from({ length: Math.max(0, size - 2) }, (_, index) => index + 1);

  function evaluate(order: number[]) {
    let cost = 0;
    let distanceMeters = 0;
    let durationSeconds = 0;
    for (let index = 1; index < order.length; index++) {
      const from = order[index - 1];
      const to = order[index];
      const duration = matrix.durations[from][to];
      const distance = matrix.distances[from][to];
      if (duration === null || distance === null || !Number.isFinite(duration) || !Number.isFinite(distance) || duration < 0 || distance < 0) return;
      cost += objective === "duration" ? duration : distance;
      distanceMeters += distance;
      durationSeconds += duration;
    }
    if (cost < bestCost) {
      bestCost = cost;
      bestOrder = [...order];
      bestDistance = distanceMeters;
      bestDuration = durationSeconds;
    }
  }

  function permute(remaining: number[], prefix: number[]) {
    if (!remaining.length) {
      evaluate([0, ...prefix, size - 1]);
      return;
    }
    for (let index = 0; index < remaining.length; index++) {
      permute([...remaining.slice(0, index), ...remaining.slice(index + 1)], [...prefix, remaining[index]]);
    }
  }

  permute(interior, []);
  if (!bestOrder) return null;
  return {
    order: bestOrder,
    estimatedDistanceKm: Math.round(bestDistance / 100) / 10,
    estimatedDurationMinutes: Math.ceil(bestDuration / 60),
    objective,
  };
}

export async function getDrivingMatrix(stops: RouteStop[]): Promise<RouteMatrix | null> {
  const key = process.env.OPENROUTESERVICE_API_KEY;
  if (!key || stops.length < 2 || stops.length > 8 || stops.some((stop) => stop.latitude === null || stop.longitude === null)) return null;

  try {
    const response = await fetch("https://api.heigit.org/openrouteservice/v2/matrix/driving-car", {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify({ locations: stops.map((stop) => [stop.longitude, stop.latitude]), metrics: ["duration", "distance"], units: "m" }),
      signal: AbortSignal.timeout(9000),
      cache: "force-cache",
      next: { revalidate: 60 * 60 },
    });
    if (!response.ok) return null;
    const json = await response.json() as Partial<RouteMatrix>;
    if (!Array.isArray(json.durations) || !Array.isArray(json.distances)) return null;
    if (json.durations.length !== stops.length || json.distances.length !== stops.length) return null;
    return { durations: json.durations, distances: json.distances };
  } catch {
    return null;
  }
}

export async function getDrivingRoute(stops: RouteStop[], preference: RoutePreference = "fastest"): Promise<RouteResult | null> {
  const key = process.env.OPENROUTESERVICE_API_KEY;
  const routable = stops.filter((place) => place.latitude !== null && place.longitude !== null);
  if (!key || routable.length < 2 || routable.length > 8) return null;

  try {
    const response = await fetch(`https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson?preference=${preference}`, {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json", Accept: "application/geo+json" },
      body: JSON.stringify({ coordinates: routable.map((place) => [place.longitude, place.latitude]) }),
      signal: AbortSignal.timeout(9000),
      cache: "force-cache",
      next: { revalidate: 60 * 60 },
    });
    if (!response.ok) return null;
    const json = await response.json() as {
      features?: Array<{
        geometry?: { coordinates?: [number, number][] };
        properties?: { summary?: { distance?: number; duration?: number } };
      }>;
    };
    const feature = json.features?.[0];
    const distance = feature?.properties?.summary?.distance;
    const duration = feature?.properties?.summary?.duration;
    if (!feature || typeof distance !== "number" || typeof duration !== "number") return null;
    return {
      distanceKm: Math.round(distance / 100) / 10,
      durationMinutes: Math.ceil(duration / 60),
      geometry: (feature.geometry?.coordinates ?? []).map(([longitude, latitude]) => [latitude, longitude]),
    };
  } catch {
    return null;
  }
}
