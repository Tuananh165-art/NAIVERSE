import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { places } from "@/lib/catalog";
import { requestDeepSeekJson } from "@/lib/deepseek";
import { buildGuideSystemPrompt, buildPlaceGuideDocuments, rankGuideDocumentsByQuestion } from "@/lib/guide-retrieval";
import { guideAnswerSchema } from "@/lib/schemas";

type Locale = "vi" | "en";
type CatalogCase = {
  id: string;
  placeId: string;
  expectedRef: string;
  question: Record<Locale, string>;
};

const developmentCases: CatalogCase[] = [
  {
    id: "operator-entrance-description",
    placeId: "amazing-bay",
    expectedRef: "evidence:amazing-bay:2",
    question: {
      vi: "Trang vị trí mô tả cổng vào Amazing Bay ở phía nào của Quốc lộ 51?",
      en: "What side of Highway 51 is the operator entrance on when travelling toward Long Thanh?",
    },
  },
  {
    id: "operator-quoted-schedule",
    placeId: "buu-long",
    expectedRef: "evidence:buu-long:1",
    question: {
      vi: "Nguồn báo địa phương ghi giờ nào và thường nghỉ vào thứ mấy?",
      en: "Which opening schedule did the local paper quote, and which weekday is usually closed?",
    },
  },
  {
    id: "night-combo-ticket-amount",
    placeId: "son-tien-amazing-world",
    expectedRef: "evidence:son-tien-amazing-world:1",
    question: {
      vi: "Trang combo buổi tối ghi giá vé người lớn bao nhiêu?",
      en: "What adult ticket amount does the official night-combo page list?",
    },
  },
];

// Independent catalog-backed holdout; do not tune retrieval or prompts from its outcome.
const holdoutCases: CatalogCase[] = [
  {
    id: "historical-holiday-price",
    placeId: "buu-long",
    expectedRef: "evidence:buu-long:2",
    question: {
      vi: "Giá vé Bửu Long trong nguồn này áp dụng dịp Tết Dương lịch năm nào, có phải giá hiện hành không?",
      en: "Which New Year holiday does this Buu Long ticket price refer to, and is it current?",
    },
  },
  {
    id: "mapped-gate-not-tourist-entrance",
    placeId: "ma-da-reserve",
    expectedRef: "evidence:ma-da-reserve:1",
    question: {
      vi: "Cổng được gắn trên bản đồ có xác nhận khách du lịch được vào khu bảo tồn Mã Đà không?",
      en: "Does the mapped gate confirm that tourists can enter the Ma Da reserve?",
    },
  },
  {
    id: "park-fare-validity",
    placeId: "cat-tien",
    expectedRef: "evidence:cat-tien:1",
    question: {
      vi: "Bảng giá của Vườn quốc gia Cát Tiên còn hiệu lực đến khi nào?",
      en: "Until when does the Cat Tien National Park fare schedule remain valid?",
    },
  },
];

const enabled = process.env.RUN_LIVE_AI_GUIDE_CATALOG_EVAL === "true";
if (enabled) process.loadEnvFile(".env");
const selectedSplit = process.env.RUN_LIVE_AI_GUIDE_CATALOG_SPLIT;
if (enabled && selectedSplit !== "development" && selectedSplit !== "holdout") {
  throw new Error("RUN_LIVE_AI_GUIDE_CATALOG_SPLIT must be development or holdout.");
}
const activeCases = selectedSplit === "holdout" ? holdoutCases : developmentCases;

function getDocuments(testCase: CatalogCase, locale: Locale) {
  const place = places.find((item) => item.id === testCase.placeId);
  if (!place) throw new Error("Catalog place missing for evaluation case: " + testCase.placeId);
  return buildPlaceGuideDocuments([place], locale);
}

describe("Guide retrieval against actual NaiVerse catalog evidence", () => {
  for (const [split, cases] of [["development", developmentCases], ["holdout", holdoutCases]] as const) {
    for (const locale of ["vi", "en"] as const) {
      for (const testCase of cases) {
        it(`${split}/${locale}/${testCase.id} retrieves the cited catalog record`, () => {
          const candidates = rankGuideDocumentsByQuestion(getDocuments(testCase, locale), testCase.question[locale], 8);
          expect(candidates.map(({ ref }) => ref)).toContain(testCase.expectedRef);
        });
      }
    }
  }
});

describe.skipIf(!enabled)(`live DeepSeek Guide catalog evaluation (${selectedSplit})`, () => {
  for (const locale of ["vi", "en"] as const) {
    for (const testCase of activeCases) {
      it(`${locale}/${testCase.id} selects an exact excerpt from the expected catalog evidence`, async () => {
        const question = testCase.question[locale];
        const documents = rankGuideDocumentsByQuestion(getDocuments(testCase, locale), question, 8);
        const sourceByRef = new Map(documents.map((document) => [document.ref, document]));
        expect(sourceByRef.has(testCase.expectedRef)).toBe(true);
        const schema = guideAnswerSchema.superRefine((answer, context) => {
          answer.excerpts.forEach((excerpt, index) => {
            const source = sourceByRef.get(excerpt.citationRef);
            if (!source || !source.content.includes(excerpt.text)) {
              context.addIssue({
                code: "custom",
                path: ["excerpts", index],
                message: "Excerpt must be an exact substring of its cited catalog evidence.",
              });
            }
          });
        });
        const answer = await requestDeepSeekJson({
          schema,
          maxTokens: 450,
          system: buildGuideSystemPrompt(),
          input: {
            locale,
            selectedPlaceId: testCase.placeId,
            question,
            retrievedDocuments: documents.map(({ ref, label, checkedAt, status, content }) => ({ ref, label, checkedAt, status, content })),
          },
        });
        expect(answer.excerpts.some((excerpt) => excerpt.citationRef === testCase.expectedRef)).toBe(true);
        expect(answer.excerpts.every((excerpt) => sourceByRef.get(excerpt.citationRef)?.content.includes(excerpt.text))).toBe(true);
      }, 30_000);
    }
  }
});
