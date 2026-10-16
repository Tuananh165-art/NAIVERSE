export type PriceEquivalenceConfirmation = {
  sameItem: boolean;
  sameUnit: boolean;
  sameAudience: boolean;
  sameValidity: boolean;
  sameTerms: boolean;
};

export type ComparablePriceReference = {
  amountVnd: number | null;
  status: string;
  validFrom: string | null;
  validTo: string | null;
};

export type PriceComparison = {
  quoteAmountVnd: number;
  referenceAmountVnd: number;
  differenceVnd: number;
  relation: "higher" | "lower" | "same";
};

const equivalenceChecks: Array<keyof PriceEquivalenceConfirmation> = [
  "sameItem", "sameUnit", "sameAudience", "sameValidity", "sameTerms",
];

/** Parses only an explicit VND amount with unambiguous thousands separators. */
export function parseExplicitVndAmount(priceText: string): number | null {
  const normalized = priceText.normalize("NFKC").replace(/[\u00a0\u202f]/gu, " ").trim();
  const match = normalized.match(/^((?:VND|VNĐ|đ|₫)\s*)?(\d{1,3}(?:[.,\s]\d{3})+|\d+)(?:\s*(VND|VNĐ|đ|₫))?$/iu);
  if (!match || (!match[1] && !match[3])) return null;
  const amount = Number(match[2].replace(/[.,\s]/gu, ""));
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

export function compareConfirmedVndPrices(input: {
  quotePriceText: string;
  evidenceVerified: boolean;
  priceTextVerified: boolean;
  reference: ComparablePriceReference | undefined;
  confirmations: PriceEquivalenceConfirmation;
  today: string;
}): PriceComparison | null {
  const { reference } = input;
  if (!input.evidenceVerified || !input.priceTextVerified || !reference) return null;
  if (reference.status !== "verified" || reference.amountVnd === null || !Number.isSafeInteger(reference.amountVnd)) return null;
  if ((reference.validFrom && reference.validFrom > input.today) || (reference.validTo && reference.validTo < input.today)) return null;
  if (equivalenceChecks.some((check) => !input.confirmations[check])) return null;

  const quoteAmountVnd = parseExplicitVndAmount(input.quotePriceText);
  if (quoteAmountVnd === null) return null;
  const differenceVnd = quoteAmountVnd - reference.amountVnd;
  return {
    quoteAmountVnd,
    referenceAmountVnd: reference.amountVnd,
    differenceVnd,
    relation: differenceVnd > 0 ? "higher" : differenceVnd < 0 ? "lower" : "same",
  };
}
