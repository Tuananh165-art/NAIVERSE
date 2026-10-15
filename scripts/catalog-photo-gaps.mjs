import { places } from "../src/lib/catalog.ts";

// This is an experience category, not one verified physical place. Keep its
// clearly labeled illustration and do not treat the absence of a photo as a gap.
const photoOptionalIds = new Set(["community-cultural-experiences"]);
const optionalWithoutPhoto = places.filter(
  (place) => photoOptionalIds.has(place.id) && place.photos.length === 0,
);
const required = places.filter((place) => !photoOptionalIds.has(place.id));
const missingRequired = required.filter((place) => place.photos.length === 0);
const withPhotoRequired = required.length - missingRequired.length;

console.log(
  `Places: ${places.length}; photo-required: ${required.length}; with photo: ${withPhotoRequired}; missing required photos: ${missingRequired.length}; intentionally illustrated: ${optionalWithoutPhoto.length}`,
);
for (const place of missingRequired) {
  console.log(`MISSING\t${place.id}\t${place.name}\t${place.nameEn}\tgroup=${place.isGroup}`);
}
for (const place of optionalWithoutPhoto) {
  console.log(`OPTIONAL\t${place.id}\t${place.name}\t${place.nameEn}\tgroup=${place.isGroup}`);
}
