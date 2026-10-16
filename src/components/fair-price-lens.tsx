"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { CircleDollarSign, LoaderCircle, Sparkles } from "lucide-react";
import { compareConfirmedVndPrices, type PriceEquivalenceConfirmation } from "@/lib/price-comparison";

type PriceReference = {
  id: string; label: string; audience: string; amountVnd: number | null; status: string; statusLabel: string;
  validFrom: string | null; validTo: string | null; sourceUrl: string | null; sourceLabel: string; checkedAt: string | null; terms: string;
};
type ReviewItem = {
  label: string; priceText: string; audience: string; validity: string; included: string[]; excluded: string[];
  evidence: string; possibleReferenceId: string | null; missingFields: string[]; evidenceVerified: boolean; priceTextVerified: boolean;
};
type Review = { items: ReviewItem[]; questions: string[]; references: PriceReference[]; disclaimer: string; aiUsed: boolean };
type Destination = { id: string; name: string; nameEn: string };
type ComparisonChoice = { referenceId: string; confirmations: PriceEquivalenceConfirmation };

const emptyConfirmations = (): PriceEquivalenceConfirmation => ({
  sameItem: false, sameUnit: false, sameAudience: false, sameValidity: false, sameTerms: false,
});

function todayInVietnam() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const missingLabels: Record<string, { vi: string; en: string }> = {
  audience: { vi: "đối tượng áp dụng", en: "eligible audience" },
  unit: { vi: "đơn vị tính", en: "price unit" },
  validity: { vi: "thời hạn áp dụng", en: "validity dates" },
  included: { vi: "dịch vụ đã bao gồm", en: "included services" },
  excluded: { vi: "khoản chưa bao gồm", en: "excluded costs" },
  taxes_fees: { vi: "thuế/phí phụ thu", en: "taxes or surcharges" },
  cancellation: { vi: "điều kiện đổi/hủy", en: "change or cancellation terms" },
};

function money(value: number, en: boolean) {
  return `${new Intl.NumberFormat(en ? "en-US" : "vi-VN").format(value)} ₫`;
}

function statusLabel(status: string, en: boolean) {
  const labels: Record<string, { vi: string; en: string }> = {
    verified: { vi: "đã xác minh trong phạm vi nguồn", en: "verified within the listed source scope" },
    unknown: { vi: "chưa xác nhận", en: "unconfirmed" },
    historical: { vi: "lịch sử/hết hiệu lực", en: "historical or expired" },
    conflicting: { vi: "nguồn mâu thuẫn", en: "conflicting sources" },
    stale_reconfirm: { vi: "cần xác nhận lại", en: "reconfirmation needed" },
    expired: { vi: "đã hết hiệu lực", en: "expired" },
    not_yet_effective: { vi: "chưa đến ngày hiệu lực", en: "not yet effective" },
  };
  return (labels[status] ?? { vi: status, en: status })[en ? "en" : "vi"];
}

export function FairPriceLens({ signedIn, places }: { signedIn: boolean; places: Destination[] }) {
  const locale = useLocale();
  const en = locale === "en";
  const [placeId, setPlaceId] = useState(places[0]?.id ?? "");
  const [quoteText, setQuoteText] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [comparisonChoices, setComparisonChoices] = useState<Record<number, ComparisonChoice>>({});

  async function submit() {
    setError("");
    setReview(null);
    setComparisonChoices({});
    setLoading(true);
    try {
      const response = await fetch("/api/ai/fair-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, quoteText: quoteText.trim(), locale, consent }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? (en ? "The quote could not be reviewed." : "Chưa thể rà soát báo giá."));
      const nextReview = body as Review;
      setReview(nextReview);
      setComparisonChoices(Object.fromEntries(nextReview.items.map((item, index) => {
        const references = nextReview.references.filter((candidate) => candidate.status === "verified" && candidate.amountVnd !== null);
        const suggestedReference = references.find((candidate) => candidate.id === item.possibleReferenceId) ?? references[0];
        return [index, { referenceId: suggestedReference?.id ?? "", confirmations: emptyConfirmations() }];
      })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (en ? "Please try again." : "Vui lòng thử lại."));
    } finally { setLoading(false); }
  }

  function updateComparison(index: number, update: { referenceId?: string; confirmations?: Partial<PriceEquivalenceConfirmation> }) {
    setComparisonChoices((current) => {
      const existing = current[index] ?? { referenceId: "", confirmations: emptyConfirmations() };
      return {
        ...current,
        [index]: {
          ...existing,
          ...update,
          confirmations: update.confirmations ? { ...existing.confirmations, ...update.confirmations } : existing.confirmations,
        },
      };
    });
  }

  return <div className="split-layout" style={{ marginTop: 24 }}>
    <section className="panel">
      <h2 className="panel-title"><CircleDollarSign size={19}/>{en ? "Review a pasted quote" : "Rà soát văn bản báo giá"}</h2>
      <p className="panel-copy">{en ? "Paste text only; uploads are not supported. Remove names, phone numbers, email addresses and booking codes before sending." : "Chỉ dán văn bản, chưa hỗ trợ tải tệp. Hãy xóa tên, số điện thoại, email và mã đặt chỗ trước khi gửi."}</p>
      <label className="form-label" htmlFor="price-review-place">{en ? "Destination" : "Địa điểm"}</label>
      <select id="price-review-place" className="field" value={placeId} onChange={(event) => { setPlaceId(event.target.value); setReview(null); }} disabled={loading}>
        {places.map((place) => <option key={place.id} value={place.id}>{en ? place.nameEn : place.name}</option>)}
      </select>
      <label className="form-label" htmlFor="price-review-text" style={{ marginTop: 14 }}>{en ? "Quote text" : "Nội dung báo giá"}</label>
      <textarea id="price-review-text" className="field" rows={9} minLength={30} maxLength={4000} value={quoteText} onChange={(event) => { setQuoteText(event.target.value); setReview(null); }} disabled={loading} placeholder={en ? "Paste the relevant quote, terms and exclusions…" : "Dán phần báo giá, điều kiện và khoản chưa bao gồm…"}/>
      <p className="form-hint">{quoteText.length}/4000 · {en ? "The text is sent to DeepSeek only after consent and is not saved by this feature." : "Văn bản chỉ được gửi tới DeepSeek sau khi bạn đồng ý và không được tính năng này lưu lại."}</p>
      <label className="form-hint" style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 12 }}>
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={loading}/>
        <span>{en ? "I agree to send the pasted text, selected destination and public catalog price records to DeepSeek for extraction." : "Tôi đồng ý gửi văn bản đã dán, địa điểm đã chọn và bản ghi giá catalog công khai tới DeepSeek để trích xuất."}</span>
      </label>
      {!signedIn && <p className="form-hint">{en ? "Sign in is required." : "Cần đăng nhập để sử dụng."} <Link className="text-link" href="/auth">{en ? "Sign in or register" : "Đăng nhập hoặc đăng ký"}</Link></p>}
      {error && <div className="alert alert-red" role="alert" style={{ marginTop: 12 }}>{error}</div>}
      <button className="button button-primary" type="button" onClick={submit} disabled={!signedIn || !consent || !placeId || quoteText.trim().length < 30 || loading} style={{ width: "100%", marginTop: 14 }}>
        {loading ? <LoaderCircle className="animate-spin" size={17}/> : <Sparkles size={17}/>}
        {loading ? (en ? "Reviewing quote…" : "Đang rà soát báo giá…") : (en ? "Extract details with AI" : "Trích thông tin bằng AI")}
      </button>
    </section>

    <section className="panel" aria-live="polite">
      <h2 className="panel-title">{en ? "Extracted details and references" : "Thông tin trích xuất và giá tham khảo"}</h2>
      {!review && <p className="panel-copy">{en ? "AI does not decide whether a quote is fair. Verify every excerpt, unit, audience and term with the provider." : "AI không kết luận báo giá tốt hay xấu. Hãy kiểm tra từng trích đoạn, đơn vị, đối tượng và điều kiện với nhà cung cấp."}</p>}
      {review && <>
        <p className="alert alert-blue" role="status">{review.disclaimer}</p>
        {review.items.map((item, index) => {
          const reference = review.references.find((candidate) => candidate.id === item.possibleReferenceId);
          const choice = comparisonChoices[index] ?? { referenceId: "", confirmations: emptyConfirmations() };
          const selectedReference = review.references.find((candidate) => candidate.id === choice.referenceId);
          const eligibleReferences = review.references.filter((candidate) => candidate.status === "verified" && candidate.amountVnd !== null);
          const comparison = compareConfirmedVndPrices({
            quotePriceText: item.priceText,
            evidenceVerified: item.evidenceVerified,
            priceTextVerified: item.priceTextVerified,
            reference: selectedReference,
            confirmations: choice.confirmations,
            today: todayInVietnam(),
          });
          return <article className="panel" key={`${item.label}-${index}`} style={{ marginTop: 14, padding: 16 }}>
            <h3>{item.label}</h3>
            <p><strong>{en ? "Extracted price text" : "Phần giá trích xuất"}:</strong> {item.priceText || (en ? "Not verified" : "Chưa xác minh được")}</p>
            <p><strong>{en ? "Audience" : "Đối tượng"}:</strong> {item.audience || (en ? "Not stated" : "Không nêu")}</p>
            <p><strong>{en ? "Validity" : "Hiệu lực"}:</strong> {item.validity || (en ? "Not stated" : "Không nêu")}</p>
            {item.evidenceVerified
              ? <blockquote className="form-hint" style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 12 }}>{item.evidence}</blockquote>
              : <p className="form-hint" role="alert">{en ? "The model's excerpt did not match the pasted text; do not rely on this extraction." : "Trích đoạn model trả về không khớp văn bản đã dán; không dùng kết quả này."}</p>}
            {item.included.length > 0 && <p><strong>{en ? "Included" : "Đã bao gồm"}:</strong> {item.included.join("; ")}</p>}
            {item.excluded.length > 0 && <p><strong>{en ? "Excluded" : "Chưa bao gồm"}:</strong> {item.excluded.join("; ")}</p>}
            {item.missingFields.length > 0 && <p className="form-hint"><strong>{en ? "Missing or unclear" : "Thiếu hoặc chưa rõ"}:</strong> {item.missingFields.map((field) => missingLabels[field]?.[en ? "en" : "vi"] ?? field).join(", ")}</p>}
            {reference && item.evidenceVerified && <div className="alert alert-blue" style={{ marginTop: 12 }}>
              <strong>{en ? "Possible catalog reference; manually confirm equivalence" : "Có giá tham khảo ứng viên; hãy tự xác nhận tính tương đương"}</strong>
              <p>{reference.label} · {reference.amountVnd === null ? (en ? "amount unknown" : "chưa có số tiền") : money(reference.amountVnd, en)} · {statusLabel(reference.status, en)}</p>
              <p className="form-hint">{reference.audience} · {reference.terms}</p>
            </div>}
            {item.evidenceVerified && <section aria-label={en ? "Confirmed numeric comparison" : "Đối chiếu số liệu có xác nhận"} style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #e4ebe5" }}>
              <h4>{en ? "Optional numeric comparison" : "Đối chiếu số liệu (tùy chọn)"}</h4>
              <p className="form-hint">{en ? "This is arithmetic only. Compare only a current verified VND catalog record, and check every equivalence below with the provider first." : "Đây chỉ là phép tính. Chỉ so với bản ghi catalog VND đã xác minh hiện tại; hãy hỏi nhà cung cấp và xác nhận từng điều kiện tương đương trước."}</p>
              {eligibleReferences.length > 0 && item.priceTextVerified ? <>
                <label className="form-label" htmlFor={`price-reference-${index}`}>{en ? "Verified catalog reference" : "Giá catalog đã xác minh"}</label>
                <select id={`price-reference-${index}`} className="field" value={choice.referenceId} onChange={(event) => updateComparison(index, { referenceId: event.target.value, confirmations: emptyConfirmations() })}>
                  <option value="">{en ? "Choose a reference" : "Chọn bản ghi giá"}</option>
                  {eligibleReferences.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label} · {candidate.amountVnd === null ? "—" : money(candidate.amountVnd, en)} · {candidate.audience}</option>)}
                </select>
                {selectedReference && <fieldset style={{ border: 0, padding: 0, margin: "12px 0", display: "grid", gap: 8 }}>
                  <legend className="form-label">{en ? "Confirm equivalence with the provider" : "Xác nhận tính tương đương với nhà cung cấp"}</legend>
                  {([
                    ["sameItem", en ? "Same product or service" : "Cùng sản phẩm hoặc dịch vụ"],
                    ["sameUnit", en ? "Same unit and quantity basis" : "Cùng đơn vị và cách tính số lượng"],
                    ["sameAudience", en ? "Same eligible audience" : "Cùng đối tượng áp dụng"],
                    ["sameValidity", en ? "Same travel date and validity period" : "Cùng ngày đi và thời hạn áp dụng"],
                    ["sameTerms", en ? "Same inclusions, exclusions and conditions" : "Cùng khoản bao gồm, chưa gồm và điều kiện"],
                  ] as const).map(([key, label]) => <label key={key} className="form-hint" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <input type="checkbox" checked={choice.confirmations[key]} onChange={(event) => updateComparison(index, { confirmations: { [key]: event.target.checked } })}/>
                    <span>{label}</span>
                  </label>)}
                </fieldset>}
                {comparison && selectedReference && <div className="alert alert-blue" role="status">
                  <p>{en ? "Quote amount" : "Mức trong báo giá"}: {money(comparison.quoteAmountVnd, en)} · {en ? "catalog amount" : "mức catalog"}: {money(comparison.referenceAmountVnd, en)}</p>
                  <strong>{comparison.relation === "same"
                    ? (en ? "The numeric amounts are equal." : "Hai số tiền bằng nhau.")
                    : comparison.relation === "higher"
                      ? (en ? `The quote amount is higher by ${money(comparison.differenceVnd, en)}.` : `Số tiền báo giá cao hơn ${money(comparison.differenceVnd, en)}.`)
                      : (en ? `The quote amount is lower by ${money(Math.abs(comparison.differenceVnd), en)}.` : `Số tiền báo giá thấp hơn ${money(Math.abs(comparison.differenceVnd), en)}.`)}</strong>
                  <p className="form-hint">{en ? "This arithmetic does not judge value, verify the provider or guarantee availability." : "Phép tính này không đánh giá đáng tiền, xác minh nhà cung cấp hoặc bảo đảm còn dịch vụ."}</p>
                </div>}
                {!comparison && <p className="form-hint" role="status">{en ? "No comparison is shown until the quote amount and all five equivalence checks are supported and confirmed." : "Chưa hiện phép so sánh cho đến khi số tiền hợp lệ và cả năm điều kiện tương đương được xác nhận."}</p>}
              </> : <p className="form-hint">{en ? "A numeric comparison is unavailable: the quote amount is not verified or there is no current verified catalog amount." : "Chưa thể đối chiếu số: giá trong báo giá chưa được xác minh hoặc chưa có giá catalog hiện hành đã xác minh."}</p>}
            </section>}
          </article>;
        })}
        {review.questions.length > 0 && <div style={{ marginTop: 18 }}><strong>{en ? "Questions to ask the provider" : "Câu hỏi nên gửi nhà cung cấp"}</strong><ul>{review.questions.map((question, index) => <li key={index}>{question}</li>)}</ul></div>}
        {review.references.length > 0 && <div style={{ marginTop: 20 }}><strong>{en ? "Catalog records for this destination" : "Bản ghi giá trong catalog của địa điểm"}</strong><ul className="source-list">{review.references.map((reference) => <li key={reference.id}>
          {reference.sourceUrl ? <a href={reference.sourceUrl} target="_blank" rel="noreferrer">{reference.sourceLabel}</a> : reference.sourceLabel}
          <small> · {reference.label} · {reference.amountVnd === null ? (en ? "unknown amount" : "chưa có số tiền") : money(reference.amountVnd, en)} · {statusLabel(reference.status, en)}{reference.checkedAt ? " · " + (en ? "checked " : "đối chiếu ") + reference.checkedAt : ""}</small>
        </li>)}</ul></div>}
      </>}
    </section>
  </div>;
}
