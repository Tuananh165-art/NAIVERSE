"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { BookOpenCheck, LoaderCircle, Sparkles } from "lucide-react";

type GuideResponse = {
  excerpts: Array<{
    text: string;
    citation: { ref: string; label: string; href: string; checkedAt: string | null; status: string };
  }>;
  aiUsed: boolean;
  reason?: "no_relevant_sources";
};

function statusLabel(status: string, en: boolean) {
  if (en) return status;
  const labels: Record<string, string> = {
    verified: "đã xác minh",
    historical: "thông tin lịch sử",
    conflicting: "đang mâu thuẫn",
    unknown: "chưa xác minh",
    expired: "hết hiệu lực",
    "not yet effective": "chưa đến thời hạn áp dụng",
    "stale; requires reconfirmation": "dữ liệu cũ; cần xác nhận lại",
    "no price record listed": "chưa có bản ghi giá",
    "no hours record listed": "chưa có bản ghi giờ hoạt động",
    "source listed; claim still subject to catalog status": "có tham chiếu nguồn; vẫn theo trạng thái catalog",
    "no public source URL": "không có URL nguồn công khai",
    needs_confirmation: "cần xác nhận",
    reference: "tham khảo",
    paused_reference: "tham khảo, tạm dừng",
  };
  return labels[status] || status;
}

export function AiGuide({ signedIn, places }: { signedIn: boolean; places: Array<{ id: string; name: string; nameEn: string }> }) {
  const locale = useLocale();
  const en = locale === "en";
  const [placeId, setPlaceId] = useState(places[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GuideResponse | null>(null);
  const selected = places.find((place) => place.id === placeId);

  async function submit() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch("/api/ai/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, question, locale, consent }),
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
      <h2 className="panel-title"><BookOpenCheck size={19}/>{en ? "Ask about this destination" : "Đặt câu hỏi về địa điểm"}</h2>
      <p className="panel-copy">{en ? "NaiVerse finds matching public catalog, price and hours records. AI selects exact excerpts; it cannot add facts outside those sources." : "NaiVerse tìm hồ sơ công khai, giá và giờ liên quan. AI chọn trích đoạn nguyên văn, không tự thêm dữ kiện ngoài nguồn."}</p>
      <label className="form-label" htmlFor="guide-place">{en ? "Destination" : "Địa điểm"}</label>
      <select id="guide-place" className="field" value={placeId} onChange={(event) => { setPlaceId(event.target.value); setResult(null); }}>
        {places.map((place) => <option key={place.id} value={place.id}>{en ? place.nameEn : place.name}</option>)}
      </select>
      <label className="form-label" htmlFor="guide-question" style={{ marginTop: 14 }}>{en ? "Your question" : "Câu hỏi của bạn"}</label>
      <textarea id="guide-question" className="field" rows={3} minLength={8} maxLength={240} value={question} onChange={(event) => { setQuestion(event.target.value); setResult(null); }} placeholder={en ? "Example: What does the catalog say about children's tickets?" : "Ví dụ: Catalog có thông tin gì về vé trẻ em?"}/>
      <p className="form-hint">{en ? "Up to 240 characters. Questions are matched against records for the selected place; if no source matches, the guide will say it has no evidence." : "Tối đa 240 ký tự. Câu hỏi được dò trong hồ sơ của địa điểm đã chọn; không có nguồn phù hợp thì trợ lý sẽ báo thiếu căn cứ."}</p>
      <div className="alert alert-blue" style={{ marginTop: 12 }}>{en ? "Do not include names, identity numbers or private notes. Email, phone numbers and GPS coordinates are masked before the question reaches AI; the guide does not save the question." : "Không nhập tên, số giấy tờ hoặc ghi chú riêng tư. Email, số điện thoại và tọa độ GPS được che trước khi gửi AI; trợ lý không lưu câu hỏi."}</div>
      <label className="form-hint" style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 16 }}>
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}/>
        <span>{en ? "I agree to send the selected place, my question after contact/GPS masking, and matching public records to AI." : "Tôi đồng ý gửi địa điểm đã chọn, câu hỏi sau khi che liên hệ/GPS và các hồ sơ công khai phù hợp tới AI."}</span>
      </label>
      {!signedIn && <p className="form-hint">{en ? "Sign in is required to use the AI guide." : "Cần đăng nhập để dùng trợ lý AI."}</p>}
      {error && <div className="alert alert-red" role="alert" style={{ marginTop: 12 }}>{error}</div>}
      <button className="button button-primary" type="button" onClick={submit} disabled={!signedIn || !consent || !placeId || question.trim().length < 8 || loading} style={{ width: "100%", marginTop: 14 }}>
        {loading ? <LoaderCircle className="animate-spin" size={17}/> : <Sparkles size={17}/>}
        {loading ? (en ? "Searching sources…" : "Đang tìm nguồn…") : (en ? "Ask the AI guide" : "Hỏi trợ lý AI")}
      </button>
      {selected && <p className="form-hint" style={{ marginTop: 12 }}>{en ? "Selected destination: " : "Địa điểm đã chọn: "}{en ? selected.nameEn : selected.name}</p>}
    </section>

    <section className="panel" aria-live="polite">
      <h2 className="panel-title">{en ? "Source excerpts" : "Trích đoạn nguồn"}</h2>
      {!result && <p className="panel-copy">{en ? "Answers contain exact excerpts from retrieved records. Missing facts stay unknown." : "Câu trả lời gồm trích đoạn nguyên văn từ hồ sơ được truy xuất. Thông tin thiếu vẫn được ghi là chưa biết."}</p>}
      {result?.reason === "no_relevant_sources" && <div className="alert alert-blue" role="status">{en ? "The catalog has no source that matches this question. Try a more specific question or contact the operator." : "Catalog chưa có nguồn phù hợp với câu hỏi này. Hãy hỏi cụ thể hơn hoặc liên hệ đơn vị vận hành."}</div>}
      {result && <>
        <p className="form-hint">{en ? "These are exact excerpts selected from the cited records; NaiVerse does not paraphrase them. Check the source date and status before relying on changing details." : "Đây là trích đoạn nguyên văn được chọn từ nguồn dẫn; NaiVerse không diễn giải lại. Hãy kiểm tra ngày và trạng thái nguồn trước khi dùng thông tin có thể thay đổi."}</p>
        {result.excerpts.map((excerpt, index) => <article className="panel" key={`${excerpt.citation.ref}-${index}`} style={{ marginTop: 14, padding: 16 }}>
          <blockquote style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 12 }}>{excerpt.text}</blockquote>
          <p className="form-hint" style={{ marginTop: 10 }}>
            {excerpt.citation.href.startsWith("http")
              ? <a href={excerpt.citation.href} target="_blank" rel="noreferrer">{excerpt.citation.label}</a>
              : <a href={excerpt.citation.href}>{excerpt.citation.label}</a>}
            <small> · {statusLabel(excerpt.citation.status, en)}{excerpt.citation.checkedAt ? " · " + (en ? "checked " : "đối chiếu ") + excerpt.citation.checkedAt : ""}</small>
          </p>
        </article>)}
      </>}
    </section>
  </div>;
}
