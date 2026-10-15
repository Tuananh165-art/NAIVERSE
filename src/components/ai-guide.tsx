"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { BookOpenCheck, LoaderCircle, Sparkles } from "lucide-react";

type GuideIntent = "overview" | "price" | "hours" | "family_access" | "source_status";
type GuideResponse = {
  answer: string;
  followUpQuestions: string[];
  citations: Array<{ ref: string; label: string; href: string; checkedAt: string | null; status: string }>;
  aiUsed: boolean;
  reason?: string;
};

export function AiGuide({ signedIn, places }: { signedIn: boolean; places: Array<{ id: string; name: string; nameEn: string }> }) {
  const locale = useLocale();
  const en = locale === "en";
  const [placeId, setPlaceId] = useState(places[0]?.id ?? "");
  const [intent, setIntent] = useState<GuideIntent>("overview");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GuideResponse | null>(null);
  const selected = places.find((place) => place.id === placeId);

  const intentLabels: Record<GuideIntent, { vi: string; en: string }> = {
    overview: { vi: "Tổng quan địa điểm", en: "Destination overview" },
    price: { vi: "Giá và điều kiện", en: "Prices and conditions" },
    hours: { vi: "Giờ được nguồn nêu", en: "Reported hours" },
    family_access: { vi: "Gia đình và tiếp cận", en: "Family and accessibility" },
    source_status: { vi: "Nguồn và điều còn thiếu", en: "Sources and missing facts" },
  };

  async function submit() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch("/api/ai/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, intent, locale, consent }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? (en ? "The guide could not answer." : "Trợ lý chưa trả lời được."));
      setResult(body as GuideResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (en ? "Please try again." : "Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  }

  return <div className="split-layout" style={{ marginTop: 24 }}>
    <section className="panel">
      <h2 className="panel-title"><BookOpenCheck size={19}/>{en ? "Choose what to check" : "Chọn nội dung cần tra cứu"}</h2>
      <p className="panel-copy">{en ? "NaiVerse retrieves public catalog, price and hours records, then asks DeepSeek to explain only those records. There is no free-text field." : "NaiVerse truy xuất catalog, giá và giờ công khai rồi nhờ DeepSeek giải thích đúng các bản ghi đó. Màn hình không gửi văn bản tự do."}</p>
      <label className="form-label" htmlFor="guide-place">{en ? "Destination" : "Địa điểm"}</label>
      <select id="guide-place" className="field" value={placeId} onChange={(event) => { setPlaceId(event.target.value); setResult(null); }}>
        {places.map((place) => <option key={place.id} value={place.id}>{en ? place.nameEn : place.name}</option>)}
      </select>
      <label className="form-label" htmlFor="guide-intent" style={{ marginTop: 14 }}>{en ? "Question type" : "Nội dung hỏi"}</label>
      <select id="guide-intent" className="field" value={intent} onChange={(event) => { setIntent(event.target.value as GuideIntent); setResult(null); }}>
        {(Object.keys(intentLabels) as GuideIntent[]).map((key) => <option key={key} value={key}>{en ? intentLabels[key].en : intentLabels[key].vi}</option>)}
      </select>
      <label className="form-hint" style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 16 }}>
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}/>
        <span>{en ? "I agree to send the selected public place, fixed question type and retrieved catalog records to DeepSeek. No name, contact details, GPS or free-form text is sent." : "Tôi đồng ý gửi địa điểm công khai đã chọn, loại câu hỏi cố định và các bản ghi catalog liên quan tới DeepSeek. Tên, liên hệ, GPS và văn bản tự do không được gửi."}</span>
      </label>
      {!signedIn && <p className="form-hint">{en ? "Sign in is required to use the AI guide." : "Cần đăng nhập để dùng trợ lý AI."}</p>}
      {error && <div className="alert alert-red" role="alert" style={{ marginTop: 12 }}>{error}</div>}
      <button className="button button-primary" type="button" onClick={submit} disabled={!signedIn || !consent || !placeId || loading} style={{ width: "100%", marginTop: 14 }}>
        {loading ? <LoaderCircle className="animate-spin" size={17}/> : <Sparkles size={17}/>}
        {loading ? (en ? "Checking sources…" : "Đang đối chiếu nguồn…") : (en ? "Ask the AI guide" : "Hỏi trợ lý AI")}
      </button>
      {selected && <p className="form-hint" style={{ marginTop: 12 }}>{en ? "Selected destination: " : "Địa điểm đã chọn: "}{en ? selected.nameEn : selected.name}</p>}
    </section>

    <section className="panel" aria-live="polite">
      <h2 className="panel-title">{en ? "Grounded answer" : "Câu trả lời có nguồn"}</h2>
      {!result && <p className="panel-copy">{en ? "The answer will show the retrieved sources and their status. Missing facts stay unknown." : "Câu trả lời sẽ kèm nguồn được truy xuất và trạng thái của nguồn. Thông tin thiếu vẫn được ghi là chưa biết."}</p>}
      {result && <>
        <p className="panel-copy">{result.answer}</p>
        {result.followUpQuestions.length > 0 && <div style={{ marginTop: 16 }}><strong>{en ? "Questions to confirm" : "Điều nên hỏi thêm"}</strong><ul>{result.followUpQuestions.map((question, index) => <li key={index}>{question}</li>)}</ul></div>}
        {result.citations.length > 0 && <div style={{ marginTop: 16 }}><strong>{en ? "Retrieved sources" : "Nguồn đã truy xuất"}</strong><ul className="source-list">{result.citations.map((citation) => <li key={citation.ref}>
          <a href={citation.href} target={citation.href.startsWith("http") ? "_blank" : undefined} rel={citation.href.startsWith("http") ? "noreferrer" : undefined}>{citation.label}</a>
          <small> · {citation.status}{citation.checkedAt ? " · " + (en ? "checked " : "đối chiếu ") + citation.checkedAt : ""}</small>
        </li>)}</ul></div>}
        {!result.aiUsed && <p className="form-hint" role="status">{en ? "No model call was made because there was no retrieved evidence." : "Không gọi model vì không có bằng chứng phù hợp được truy xuất."}</p>}
      </>}
    </section>
  </div>;
}
