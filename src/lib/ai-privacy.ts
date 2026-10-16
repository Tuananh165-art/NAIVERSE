const coordinateKeys = new Set([
  "lat",
  "latitude",
  "lon",
  "lng",
  "longitude",
  "coordinates",
  "gps",
  "gpslocation",
]);

const dmsCoordinatePair = /(?<![\p{L}\d])\d{1,2}\s*°\s*\d{1,2}\s*['′’]\s*\d{1,2}(?:\.\d+)?\s*(?:["″”])?\s*[NSB]\s*[,;/]\s*\d{1,3}\s*°\s*\d{1,2}\s*['′’]\s*\d{1,2}(?:\.\d+)?\s*(?:["″”])?\s*[EWĐT](?![\p{L}\d])/giu;

/** Redacts direct contact details and coordinate pairs from free-form model text. */
export function redactSensitiveModelText(value: string): string {
  return value
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/gu, "[email redacted]")
    .replace(/(?<![\p{L}\d])(?:\+?\d[\s().-]*){10,15}(?![\p{L}\d])/gu, "[phone redacted]")
    .replace(dmsCoordinatePair, "[coordinates redacted]")
    .replace(/(?<![\d.])-?\d{1,3}\.\d{2,}\s*(?:°?\s*[NS])?\s*[,;/]\s*-?\d{1,3}\.\d{2,}\s*(?:°?\s*[EW])?(?!\d)/giu, "[coordinates redacted]");
}

/** Removes coordinate fields and redacts free-form strings before sending JSON to DeepSeek. */
export function sanitizeDeepSeekInput<T>(value: T): T {
  if (typeof value === "string") return redactSensitiveModelText(value) as T;
  if (Array.isArray(value)) return value.map((item) => sanitizeDeepSeekInput(item)) as T;
  if (value && typeof value === "object") {
    const safeEntries = Object.entries(value).flatMap(([key, item]) => {
      const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
      if (coordinateKeys.has(normalizedKey)) return [];
      return [[key, sanitizeDeepSeekInput(item)]];
    });
    return Object.fromEntries(safeEntries) as T;
  }
  return value;
}
