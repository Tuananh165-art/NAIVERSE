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
const labelledIdentityNumber = /(\b(?:passport(?:\s+(?:no\.?|number))?|national\s+id|identity(?:\s+card)?(?:\s+(?:no\.?|number))?|cccd|cmnd|căn\s+cước(?:\s+công\s+dân)?|can\s+cuoc(?:\s+cong\s+dan)?|số\s+giấy\s+tờ|so\s+giay\s+to)\s*(?:(?:no\.?|number|#|:|is|là)\s*)?)([A-Z0-9][A-Z0-9-]{5,19})(?![\p{L}\d])/giu;
const labelledPersonName = /(\b(?:my\s+(?:full\s+)?name\s*(?:is|[:=])|i\s+am\s+(?:called|named)|i['’]m\s+(?:called|named)|tên\s+(?:của\s+)?tôi\s+(?:là|:)|mình\s+tên\s+(?:là|:)|tôi\s+tên\s+(?:là|:)|họ\s+tên\s*(?:là|:))\s*)([\p{L}\p{M}][\p{L}\p{M}'’-]*(?:\s+[\p{L}\p{M}][\p{L}\p{M}'’-]*){0,3})(?=$|[,;.!?\n]|\s+(?:and|but|because|then|we|i|my|the|want|would|need|am|will|đi|đến|muốn|cần|gia đình|mình|tôi|và|nhưng|sẽ|đang)\b)/giu;

/** Redacts contact details, explicitly labelled names/identity numbers and coordinate pairs from free-form model text. */
export function redactSensitiveModelText(value: string): string {
  return value
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/gu, "[email redacted]")
    .replace(labelledPersonName, "$1[name redacted]")
    .replace(labelledIdentityNumber, "$1[identifier redacted]")
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
