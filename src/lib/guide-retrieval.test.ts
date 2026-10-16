import { describe, expect, it } from "vitest";
import { places } from "@/lib/catalog";
import { buildPlaceGuideDocuments, filterGuideDocumentsByIntent, findGuidePlaces, rankGuideDocumentsByQuestion, type GuideDocument } from "@/lib/guide-retrieval";

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

  it("builds Vietnamese excerpts without English field labels", () => {
    const amazingBay = places.find((place) => place.id === "amazing-bay")!;
    const document = buildPlaceGuideDocuments([amazingBay], "vi").find((item) => item.ref === "place:amazing-bay")!;
    expect(document.content).toContain("Tên: The Amazing Bay");
    expect(document.content).toContain("Trạng thái xác minh: cần xác nhận.");
    expect(document.content).not.toContain("Verification status:");
  });

  it("filters retrieved documents to the selected question type", () => {
    const documents: GuideDocument[] = ["place:one", "evidence:one:1", "price:old", "hours:reported", "catalog:prices:one", "catalog:hours:one"].map((ref) => ({
      ref, label: ref, href: "/vi/places/one", checkedAt: null, status: "unknown", content: ref,
    }));
    expect(filterGuideDocumentsByIntent(documents, "price").map(({ ref }) => ref)).toEqual(["price:old", "catalog:prices:one"]);
    expect(filterGuideDocumentsByIntent(documents, "hours").map(({ ref }) => ref)).toEqual(["hours:reported", "catalog:hours:one"]);
    expect(filterGuideDocumentsByIntent(documents, "family_access").map(({ ref }) => ref)).toEqual(["place:one", "evidence:one:1"]);
    expect(filterGuideDocumentsByIntent(documents, "source_status").map(({ ref }) => ref)).toEqual(["place:one", "evidence:one:1"]);
    expect(filterGuideDocumentsByIntent(documents, "overview")).toHaveLength(documents.length);
  });

  it("ranks Vietnamese and English price questions to price evidence", () => {
    const documents: GuideDocument[] = [
      { ref: "price:adult", label: "Adult admission price", href: "/vi/places/one", checkedAt: null, status: "reference", content: "Adult ticket price is 250000 VND; check current conditions before travel." },
      { ref: "hours:weekday", label: "Reported opening hours", href: "/vi/places/one", checkedAt: null, status: "unknown", content: "Reported opening hours are not verified as current." },
      { ref: "evidence:official", label: "Official destination page", href: "/vi/places/one", checkedAt: null, status: "reference", content: "This source lists the destination contact and general description." },
    ];

    expect(rankGuideDocumentsByQuestion(documents, "Giá vé người lớn bao nhiêu?")[0]?.ref).toBe("price:adult");
    expect(rankGuideDocumentsByQuestion(documents, "What is the adult ticket price?")[0]?.ref).toBe("price:adult");
  });

  it("returns no evidence for an unrelated natural-language question", () => {
    const documents: GuideDocument[] = [
      { ref: "place:one", label: "Amazing Bay", href: "/vi/places/one", checkedAt: null, status: "reference", content: "A family destination with activities for visitors." },
      { ref: "price:one", label: "Reported price", href: "/vi/places/one", checkedAt: null, status: "unknown", content: "Price not available in this record." },
    ];

    expect(rankGuideDocumentsByQuestion(documents, "How do I transfer cryptocurrency safely?")).toEqual([]);
  });
});
