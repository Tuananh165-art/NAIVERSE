import { places } from "../src/lib/catalog.ts";

const withoutPhotos = places.filter((place) => place.photos.length === 0);
console.log(`Places: ${places.length}; with a sourced photo: ${places.length - withoutPhotos.length}; without: ${withoutPhotos.length}`);
for (const place of withoutPhotos) {
  console.log(`${place.id}\t${place.name}\t${place.nameEn}\tgroup=${place.isGroup}`);
}
