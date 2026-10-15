import { places } from "../src/lib/catalog.ts";

const unique = new Map();
for (const place of places) {
  for (const photo of place.photos) {
    const references = unique.get(photo.url) ?? [];
    references.push({ placeId: place.id, sourceUrl: photo.sourceUrl, credit: photo.credit });
    unique.set(photo.url, references);
  }
}

const photos = [...unique].map(([url, references]) => ({ url, references }));
const failures = [];
let cursor = 0;

async function checkPhoto(photo) {
  try {
    const response = await fetch(photo.url, {
      method: "HEAD",
      headers: { "User-Agent": "NaiVerse-photo-source-check/0.1" },
      signal: AbortSignal.timeout(15_000),
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.toLowerCase().startsWith("image/")) {
      failures.push({
        photo,
        status: response.status,
        contentType: contentType || "missing",
      });
    }
  } catch (error) {
    failures.push({
      photo,
      status: "network-error",
      contentType: error instanceof Error ? error.name : "unknown",
    });
  }
}

async function worker() {
  while (cursor < photos.length) {
    const index = cursor++;
    await checkPhoto(photos[index]);
    // Keep public image-host checks gentle and avoid bursting Wikimedia.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

await Promise.all(Array.from({ length: Math.min(2, photos.length) }, () => worker()));

for (const failure of failures) {
  const placesForPhoto = failure.photo.references.map((reference) => reference.placeId).join(", ");
  console.error(`${failure.status}\t${failure.contentType}\t${placesForPhoto}\t${failure.photo.references[0].sourceUrl}`);
}

console.log(`Unique image URLs: ${photos.length}; reachable image responses: ${photos.length - failures.length}; failed: ${failures.length}`);
if (failures.length) process.exitCode = 1;
