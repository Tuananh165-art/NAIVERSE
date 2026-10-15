import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { places } from "../src/lib/catalog.ts";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const migrationDir = resolve(root, "supabase/migrations");
const outputPath = resolve(root, "NAIVERSE_SETUP_ALL.sql");
const migrationNames = (await readdir(migrationDir))
  .filter((name) => /^\d{4}_.+\.sql$/u.test(name))
  .sort((a, b) => a.localeCompare(b, "en"));

if (migrationNames.length === 0 || migrationNames[0] !== "0001_naiverse_core.sql") {
  throw new Error("Expected 0001_naiverse_core.sql as the first migration.");
}

const quote = (value) => "'" + String(value).replaceAll("'", "''") + "'";
const nullable = (value) => value == null ? "null" : quote(value);
const jsonb = (value) => quote(JSON.stringify(value)) + "::jsonb";
const rows = places.map((place) => {
  const values = [
    quote(place.id), quote(place.name), quote(place.nameEn),
    "array[" + place.aliases.map(quote).join(", ") + "]::text[]",
    quote(place.region), quote(place.regionEn), quote(place.category),
    quote(place.description), quote(place.descriptionEn), quote(place.status),
    quote(place.statusNote), quote(place.statusNoteEn),
    place.latitude == null ? "null" : String(place.latitude),
    place.longitude == null ? "null" : String(place.longitude),
    nullable(place.website), jsonb(place.evidence),
    place.isGroup ? "true" : "false", "true",
  ];
  return "  (" + values.join(", ") + ")";
}).join(",\n");

const sections = [
  "-- NAIVERSE single-run setup bundle. Generated from numbered migrations and the catalog.\n" +
  "-- Use only on a NEW, empty Supabase project. This file has no migration ledger.\n" +
  "-- Do not rerun on a populated or partially migrated database; do not run numbered migrations afterward.\n" +
  "-- Existing database: back up first, determine applied migrations, then apply ONLY missing files in order.\n" +
  "-- Catalog seed uses ON CONFLICT DO NOTHING so existing place rows are preserved.\n",
];

for (const name of migrationNames) {
  sections.push("\n-- ===== BEGIN " + name + " =====\n");
  sections.push(await readFile(resolve(migrationDir, name), "utf8"));
  sections.push("\n-- ===== END " + name + " =====\n");
  if (name === migrationNames[0]) {
    sections.push(
      "\n-- ===== BEGIN first-run catalog seed (" + places.length + " places) =====\n" +
      "insert into public.places\n" +
      "  (id, name, name_en, aliases, region, region_en, category, description, description_en,\n" +
      "   status, status_note, status_note_en, latitude, longitude, website, evidence, is_group, published)\n" +
      "values\n" + rows + "\n" +
      "on conflict (id) do nothing;\n" +
      "-- ===== END first-run catalog seed =====\n",
    );
  }
}

await writeFile(outputPath, sections.join(""), "utf8");
console.log("Wrote " + outputPath + " with " + migrationNames.length + " migrations and " + places.length + " catalog places.");
