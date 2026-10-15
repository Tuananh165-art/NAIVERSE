import type { Evidence, Place } from "@/lib/catalog";

export type GuideMatch = { place: Place; score: number };
export type GuideDocument = {
  ref: string;
  label: string;
  href: string;
  checkedAt: string | null;
  status: string;
  content: string;
};

const stopWords = new Set([
  "toi", "minh", "muon", "can", "gi", "nao", "o", "tai", "cho", "ve", "voi", "va", "la", "co", "khong", "di", "den", "duoc", "mot", "cac", "nhung", "the", "nay", "kia", "giup", "hay", "nen",
  "i", "me", "my", "we", "our", "want", "need", "what", "where", "when", "how", "is", "are", "can", "could", "to", "for", "at", "in", "on", "with", "and", "or", "a", "an", "of", "please", "visit",
]);

const categoryTerms: Record<Place["category"], string[]> = {
  nature: ["thien nhien", "nature", "rung", "forest", "ho", "lake", "thac", "waterfall", "vuon", "orchard", "ngoai troi", "outdoor"],
  culture: ["van hoa", "culture", "di tich", "heritage", "lich su", "history", "chua", "temple", "bao tang", "museum"],
  family: ["gia dinh", "family", "tre em", "child", "kids", "con nho", "water park"],
  food: ["am thuc", "food", "mon an", "restaurant", "nha hang", "an uong", "cuisine"],
  stay: ["luu tru", "stay", "hotel", "khach san", "resort", "qua dem", "overnight"],
  experience: ["trai nghiem", "experience", "cong dong", "community", "nghe", "craft"],
};

export function normalizeGuideText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(value: string) {
  return normalizeGuideText(value).split(/\s+/u).filter((token) => token.length > 1 && !stopWords.has(token));
}

export function findGuidePlaces(query: string, catalog: Place[], limit = 4): GuideMatch[] {
  const queryTokens = [...new Set(tokens(query))];
  if (!queryTokens.length) return [];

  return catalog.map((place) => {
    const identityText = normalizeGuideText([place.name, place.nameEn, ...place.aliases, place.id].join(" "));
    const regionText = normalizeGuideText([place.region, place.regionEn].join(" "));
    const supportingText = normalizeGuideText([place.description, place.descriptionEn, place.statusNote, place.statusNoteEn, ...place.evidence.map((item) => item.label)].join(" "));
    const categoryText = normalizeGuideText(categoryTerms[place.category].join(" "));
    const identityTokens = new Set(tokens(identityText));
    const regionTokens = new Set(tokens(regionText));
    const supportingTokens = new Set(tokens(supportingText));
    const categoryTokens = new Set(tokens(categoryText));
    let score = 0;
    const corePhrase = queryTokens.join(" ");
    if (corePhrase.length > 2 && identityText.includes(corePhrase)) score += 12;
    for (const token of queryTokens) {
      if (identityTokens.has(token)) score += 5;
      else if (regionTokens.has(token)) score += 2;
      else if (supportingTokens.has(token)) score += 1;
      if (categoryTokens.has(token)) score += 2;
    }
    return { place, score };
  }).filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.place.id.localeCompare(b.place.id))
    .slice(0, Math.max(1, Math.min(limit, 4)));
}

function safeExternalHref(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function buildPlaceGuideDocuments(places: Place[], locale: "vi" | "en"): GuideDocument[] {
  const documents: GuideDocument[] = [];
  for (const place of places) {
    const detailHref = "/" + locale + "/places/" + encodeURIComponent(place.id);
    documents.push({
      ref: "place:" + place.id,
      label: locale === "en" ? place.nameEn : place.name,
      href: detailHref,
      checkedAt: null,
      status: place.status,
      content: [
        "Name: " + place.name + " / " + place.nameEn + ".",
        "Aliases: " + (place.aliases.join(", ") || "none") + ".",
        "Area: " + place.region + " / " + place.regionEn + ".",
        "Category: " + place.category + "; group: " + place.isGroup + ".",
        "Description: " + (locale === "en" ? place.descriptionEn : place.description) + ".",
        "Verification status: " + place.status + ".",
        "Caveat: " + (locale === "en" ? place.statusNoteEn : place.statusNote),
      ].join(" "),
    });
    place.evidence.forEach((evidence: Evidence, index) => {
      documents.push({
        ref: "evidence:" + place.id + ":" + index,
        label: locale === "en" ? evidence.labelEn || evidence.label : evidence.label,
        href: safeExternalHref(evidence.url) || detailHref,
        checkedAt: evidence.checkedAt,
        status: evidence.url ? "source listed; claim still subject to catalog status" : "no public source URL",
        content: [
          "Source label: " + (locale === "en" ? evidence.labelEn || evidence.label : evidence.label) + ".",
          "Source URL: " + (safeExternalHref(evidence.url) || "not provided") + ".",
          "Checked date: " + (evidence.checkedAt || "not recorded") + ".",
          "This source reference does not by itself prove current operation, access, hours, price or availability.",
        ].join(" "),
      });
    });
  }
  return documents;
}
