import { createClient } from "@supabase/supabase-js";
import { places } from "../src/lib/catalog.ts";

if (process.env.NEXT_PUBLIC_SUPABASE_URL === undefined || (process.env.SUPABASE_SECRET_KEY === undefined && process.env.SUPABASE_SERVICE_ROLE_KEY === undefined)) {
  process.loadEnvFile();
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong .env.");
  process.exit(1);
}
const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const rows = places.map((place) => ({
  id: place.id, name: place.name, name_en: place.nameEn, aliases: place.aliases,
  region: place.region, region_en: place.regionEn, category: place.category,
  description: place.description, description_en: place.descriptionEn,
  status: place.status, status_note: place.statusNote, status_note_en: place.statusNoteEn,
  latitude: place.latitude, longitude: place.longitude, website: place.website,
  evidence: place.evidence, is_group: place.isGroup, published: true,
}));
const { error } = await client.from("places").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
if (error) {
  console.error("Seed danh mục thất bại:", error.message);
  process.exit(1);
}
console.log("Đã seed danh mục lần đầu (" + rows.length + " hồ sơ). Hồ sơ đã có trong database được giữ nguyên.");
