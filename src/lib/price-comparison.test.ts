import { describe, expect, it } from "vitest";
import { compareConfirmedVndPrices, parseExplicitVndAmount, type PriceEquivalenceConfirmation } from "@/lib/price-comparison";

const allConfirmed: PriceEquivalenceConfirmation = {
  sameItem: true,
  sameUnit: true,
  sameAudience: true,
  sameValidity: true,
  sameTerms: true,
};

const reference = { amountVnd: 450_000, status: "verified", validFrom: "2026-10-01", validTo: null };

describe("confirmed VND price comparison", () => {
  it.each([
    ["350.000 ₫", 350_000],
    ["350,000 VND", 350_000],
    ["₫ 1 250 000", 1_250_000],
    ["0 đ", 0],
  ])("parses explicit VND amount %s", (text, amount) => {
    expect(parseExplicitVndAmount(text)).toBe(amount);
  });

  it.each(["350.5 ₫", "350000", "1,5 triệu đồng", "350.000 USD", "350.000 ₫/khách"]) (
    "rejects ambiguous or non-VND amount %s", (text) => {
      expect(parseExplicitVndAmount(text)).toBeNull();
    },
  );

  it("compares only after quote evidence, reference status and all equivalence checks pass", () => {
    expect(compareConfirmedVndPrices({
      quotePriceText: "350.000 ₫",
      evidenceVerified: true,
      priceTextVerified: true,
      reference,
      confirmations: allConfirmed,
      today: "2026-10-16",
    })).toEqual({ quoteAmountVnd: 350_000, referenceAmountVnd: 450_000, differenceVnd: -100_000, relation: "lower" });
  });

  it("refuses comparison until every equivalence dimension is confirmed", () => {
    expect(compareConfirmedVndPrices({
      quotePriceText: "350.000 ₫",
      evidenceVerified: true,
      priceTextVerified: true,
      reference,
      confirmations: { ...allConfirmed, sameUnit: false },
      today: "2026-10-16",
    })).toBeNull();
  });

  it.each([
    { ...reference, status: "historical" },
    { ...reference, status: "stale_reconfirm" },
    { ...reference, validTo: "2026-10-15" },
    { ...reference, validFrom: "2026-10-17" },
    { ...reference, amountVnd: null },
  ])("refuses unknown, stale or out-of-date catalog references", (candidate) => {
    expect(compareConfirmedVndPrices({
      quotePriceText: "350.000 ₫",
      evidenceVerified: true,
      priceTextVerified: true,
      reference: candidate,
      confirmations: allConfirmed,
      today: "2026-10-16",
    })).toBeNull();
  });

  it("refuses unverified excerpts and price text without explicit currency", () => {
    expect(compareConfirmedVndPrices({
      quotePriceText: "350.000 ₫", evidenceVerified: false, priceTextVerified: true, reference,
      confirmations: allConfirmed, today: "2026-10-16",
    })).toBeNull();
    expect(compareConfirmedVndPrices({
      quotePriceText: "350000", evidenceVerified: true, priceTextVerified: true, reference,
      confirmations: allConfirmed, today: "2026-10-16",
    })).toBeNull();
  });
});
