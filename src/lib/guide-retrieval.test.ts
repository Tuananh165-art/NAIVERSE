import { describe, expect, it } from "vitest";
import { places } from "@/lib/catalog";
import { buildPlaceGuideDocuments, findGuidePlaces } from "@/lib/guide-retrieval";

describe("catalog RAG retrieval", () => {
  it("matches Vietnamese place aliases without diacritics", () => {
    expect(findGuidePlaces("toi muon hoi ve Tan Trieu", places)[0]?.place.id).toBe("tan-trieu-orchards");
  });

  it("finds an English name and a place alias", () => {
    expect(findGuidePlaces("what is at Ta Thiet", places)[0]?.place.id).toBe("ta-thiet");
    expect(findGuidePlaces("Ong Pagoda", places)[0]?.place.id).toBe("ong-pagoda");
  });

  it("returns no evidence for a question unrelated to the catalog", () => {
    expect(findGuidePlaces("Please explain quantum entanglement in detail", places)).toEqual([]);
  });

  it("builds source documents with internal place links and safe evidence links", () => {
    const amazingBay = places.find((place) => place.id === "amazing-bay")!;
    const documents = buildPlaceGuideDocuments([amazingBay], "en");
    expect(documents.some((document) => document.ref === "place:amazing-bay" && document.href === "/en/places/amazing-bay")).toBe(true);
    expect(documents.every((document) => document.href.startsWith("https://") || document.href.startsWith("/en/places/"))).toBe(true);
    expect(documents.some((document) => document.content.includes("does not by itself prove current operation"))).toBe(true);
  });
});
