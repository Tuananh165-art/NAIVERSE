"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { CloudSun, LoaderCircle, MapPin, ShieldAlert, Sparkles } from "lucide-react";
import { getEmergencyGuidance } from "@/lib/safety";

type ConditionsResult = {
  urgent: boolean;
  message?: string;
  hotlines?: Array<{ number: string; label: string }>;
  advice?: { summary: string; practicalSteps: string[]; indoorAlternative: string; greenAdvice: string[]; urgency: string; incidentCategory: string };
  weather?: { forecast: { date: string; weatherCode: number; temperatureMaxC: number | null; temperatureMinC: number | null; precipitationProbabilityMax: number | null; windSpeedMaxKmh: number | null }; fetchedAt: string; locationPrecision: string } | null;
  sources?: Array<{ label: string; url: string; fetchedAt: string }>;
};

export function AiConditionsForm({ signedIn }: { signedIn: boolean }) {
  const locale = useLocale();
  const en = locale === "en";
  const [mode, setMode] = useState<"weather" | "incident">("weather");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [date, setDate] = useState("");
  const [activity, setActivity] = useState("");
  const [incident, setIncident] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ConditionsResult | null>(null);
  const [gpsMessage, setGpsMessage] = useState("");

  function useGps() {
    setGpsMessage("");
    if (!navigator.geolocation) { setGpsMessage(en ? "GPS is not supported by this browser." : "Trình duyệt không hỗ trợ GPS."); return; }
    navigator.geolocation.getCurrentPosition((position) => {
      setLatitude((Math.round(position.coords.latitude * 10) / 10).toFixed(1));
      setLongitude((Math.round(position.coords.longitude * 10) / 10).toFixed(1));
      setGpsMessage(en ? "Location rounded to about 11 km for a regional forecast." : "Vị trí được làm tròn khoảng 11 km để lấy dự báo theo vùng.");
    }, () => setGpsMessage(en ? "Location permission denied or unavailable." : "Bạn đã từ chối quyền vị trí hoặc GPS không khả dụng."), { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 });
  }

  function showEmergencyContacts() {
    setError("");
    const guidance = getEmergencyGuidance(locale === "en" ? "en" : "vi");
    setResult({ urgent: true, ...guidance });
  }

  async function submit() {
    setError(""); setResult(null); setLoading(true);
    try {
      const response = await fetch("/api/ai/conditions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, locale, consent, activity, incident: mode === "incident" ? incident : undefined, latitude: mode === "weather" ? Number(latitude) : undefined, longitude: mode === "weather" ? Number(longitude) : undefined, travelDate: mode === "weather" ? date : undefined }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? (en ? "Could not get advice." : "Chưa lấy được gợi ý."));
      setResult(body as ConditionsResult);
    } catch (cause) { setError(cause instanceof Error ? cause.message : (en ? "Please retry." : "Vui lòng thử lại.")); }
    finally { setLoading(false); }
  }

  const today = new Date().toISOString().slice(0, 10);

  return <div className="split-layout" style={{ marginTop: 24 }}>
    <section className="panel">
      <div className="button-row" role="group" aria-label={en ? "Advice type" : "Loại tư vấn"}>
        <button className={`button ${mode === "weather" ? "button-primary" : "button-secondary"}`} type="button" onClick={() => { setMode("weather"); setResult(null); }}>{en ? "Weather & green trip" : "Thời tiết & du lịch xanh"}</button>
        <button className={`button ${mode === "incident" ? "button-primary" : "button-secondary"}`} type="button" onClick={() => { setMode("incident"); setResult(null); }}>{en ? "Non-urgent incident" : "Sự cố chưa khẩn cấp"}</button>
      </div>
      <button type="button" className="button button-secondary" style={{ marginTop: 12 }} onClick={showEmergencyContacts}>{en ? "Urgent: show direct emergency contacts" : "Khẩn cấp: hiện số gọi trực tiếp"}</button>
      {mode === "weather" ? <>
        <h2 className="panel-title" style={{ marginTop: 20 }}><CloudSun size={18}/>{en ? "Regional forecast" : "Dự báo theo vùng"}</h2>
        <p className="panel-copy">{en ? "Choose a date in the next 7 days and a location. GPS is optional and rounded before sending to the weather provider." : "Chọn ngày trong 7 ngày tới và vị trí. GPS là tùy chọn, được làm tròn trước khi gửi tới nhà cung cấp thời tiết."}</p>
        <button type="button" className="button button-secondary" onClick={useGps}><MapPin size={16}/>{en ? "Use approximate GPS" : "Dùng GPS gần đúng"}</button>{gpsMessage && <p role="status" className="form-hint">{gpsMessage}</p>}
        <div className="intent-fields" style={{ marginTop: 16 }}>
          <label><span>{en ? "Latitude" : "Vĩ độ"}</span><input className="field" inputMode="decimal" type="number" min="8" max="24" step="0.1" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="11.1"/></label>
          <label><span>{en ? "Longitude" : "Kinh độ"}</span><input className="field" inputMode="decimal" type="number" min="102" max="110" step="0.1" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="107.1"/></label>
          <label><span>{en ? "Travel date" : "Ngày đi"}</span><input className="field" type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)}/></label>
          <label><span>{en ? "Planned outdoor activity" : "Hoạt động ngoài trời dự định"}</span><input className="field" maxLength={240} value={activity} onChange={(event) => setActivity(event.target.value)} placeholder={en ? "e.g. lake walk" : "Ví dụ: đi bộ ven hồ"}/></label>
        </div>
      </> : <>
        <h2 className="panel-title" style={{ marginTop: 20 }}><ShieldAlert size={18}/>{en ? "Describe a non-urgent issue" : "Mô tả sự cố chưa khẩn cấp"}</h2>
        <p className="panel-copy">{en ? "Do not enter names, contact details or exact live location. This is not a medical or emergency service." : "Không nhập tên, thông tin liên hệ hoặc vị trí trực tiếp chính xác. Đây không phải dịch vụ y tế hay cứu hộ."}</p>
        <label className="form-label" htmlFor="incident-description">{en ? "What happened?" : "Chuyện gì đã xảy ra?"}</label>
        <textarea id="incident-description" className="field" rows={5} maxLength={1000} value={incident} onChange={(event) => setIncident(event.target.value)} placeholder={en ? "Describe only the facts needed for basic guidance." : "Chỉ mô tả dữ kiện cần thiết để nhận hướng dẫn cơ bản."}/>
      </>}
      <label className="form-hint" style={{ display: "flex", gap: 8, marginTop: 14 }}><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}/><span>{en ? "I agree to send this request to DeepSeek for advice. Coarse weather coordinates go only to Open-Meteo; exact GPS is not included in the AI prompt." : "Tôi đồng ý gửi yêu cầu đến DeepSeek để nhận gợi ý. Tọa độ thời tiết gần đúng chỉ gửi Open-Meteo; GPS chính xác không được đưa vào prompt AI."}</span></label>
      {!signedIn && <p className="form-hint">{en ? "Sign in is required for AI advice." : "Cần đăng nhập để dùng tư vấn AI."}</p>}
      {error && <div className="alert alert-red" role="alert" style={{ marginTop: 12 }}>{error}</div>}
      <button type="button" className="button button-primary" style={{ marginTop: 14, width: "100%" }} onClick={submit} disabled={!signedIn || !consent || loading || (mode === "weather" && (!date || !latitude || !longitude)) || (mode === "incident" && incident.trim().length < 12)}>{loading ? <LoaderCircle className="animate-spin" size={17}/> : <Sparkles size={17}/>} {loading ? (en ? "Checking…" : "Đang kiểm tra…") : (en ? "Get AI advice" : "Nhận gợi ý AI")}</button>
    </section>
    <section className="panel" aria-live="polite">
      <h2 className="panel-title">{en ? "Source-grounded guidance" : "Gợi ý kèm dữ liệu nguồn"}</h2>
      {result?.urgent ? <div className="alert alert-red" role="alert"><strong>{result.message}</strong><div className="button-row" style={{ marginTop: 12 }}>{result.hotlines?.map((line) => <a className="button button-primary" href={`tel:${line.number}`} key={line.number}>{line.label} {line.number}</a>)}</div></div> : result?.advice ? <>
        {result.weather && <div className="metric-row"><div className="metric"><span className="metric-label">{en ? "Date" : "Ngày"}</span><strong className="metric-value">{result.weather.forecast.date}</strong></div><div className="metric"><span className="metric-label">{en ? "Temperature" : "Nhiệt độ"}</span><strong className="metric-value">{result.weather.forecast.temperatureMinC ?? "—"}° – {result.weather.forecast.temperatureMaxC ?? "—"}°C</strong></div><div className="metric"><span className="metric-label">{en ? "Precipitation chance" : "Khả năng mưa"}</span><strong className="metric-value">{result.weather.forecast.precipitationProbabilityMax ?? "—"}%</strong></div></div>}
        <p>{result.advice.summary}</p>
        <h3 className="panel-title">{en ? "Practical steps" : "Việc nên chuẩn bị"}</h3><ul className="check-list">{result.advice.practicalSteps.map((step, i) => <li key={i}>{step}</li>)}</ul>
        {result.advice.indoorAlternative && <p><strong>{en ? "Indoor alternative: " : "Phương án trong nhà: "}</strong>{result.advice.indoorAlternative}</p>}
        {result.advice.greenAdvice.length > 0 && <><h3 className="panel-title">{en ? "Lower-impact ideas" : "Gợi ý giảm tác động"}</h3><ul className="check-list">{result.advice.greenAdvice.map((step, i) => <li key={i}>{step}</li>)}</ul></>}
        {result.weather && <div className="alert alert-blue" style={{ marginTop: 14 }}>{en ? "Regional model forecast, not an official warning or venue-level measurement. Last fetched: " : "Dự báo mô hình theo vùng, không phải cảnh báo chính thức hay phép đo tại điểm đến. Lấy lúc: "}{new Date(result.weather.fetchedAt).toLocaleString(en ? "en-US" : "vi-VN")}. {result.weather.locationPrecision}</div>}
        {result.sources?.map((source) => <p className="form-hint" key={source.url}><a className="text-link" href={source.url} target="_blank" rel="noreferrer">{source.label}</a></p>)}
      </> : <div className="empty-state">{en ? "Forecast, incident and source details will appear here." : "Dự báo, hướng dẫn sự cố và nguồn dữ liệu sẽ hiện ở đây."}</div>}
      <p className="form-hint">{en ? "Urgent danger: call 113, 114 or 115 directly. AI advice is not an official warning or professional assessment." : "Khi có nguy hiểm khẩn cấp: gọi trực tiếp 113, 114 hoặc 115. Gợi ý AI không phải cảnh báo chính thức hay đánh giá chuyên môn."}</p>
    </section>
  </div>;
}
