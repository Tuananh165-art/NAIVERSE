"use client";

import { useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { AlertCircle, ArrowRight, Check, CircleHelp, CircleDollarSign, LoaderCircle, MapPin, Route as RouteIcon, ShieldAlert, Sparkles } from "lucide-react";
import type { Place } from "@/lib/catalog";
import type { PlanOption } from "@/lib/planner";
import type { TripIntent } from "@/lib/schemas";
import { ExploreMapLoader } from "@/components/explore-map-loader";
import { PackingAssistant } from "@/components/packing-assistant";

type Result = { intent: TripIntent; options: PlanOption[]; warnings: string[]; demo: boolean };
const descriptions = { easy: { vi: "Ưu tiên trải nghiệm bạn yêu thích.", en: "Prioritizes the experiences you asked for." }, "short-drive": { vi: "Ưu tiên ở cùng một cụm địa lý.", en: "Prioritizes destinations in one region." }, varied: { vi: "Kết hợp nhiều kiểu trải nghiệm.", en: "Balances different types of experiences." } };

export function JourneyStudio({ initialPrompt, places, signedIn }: { initialPrompt: string; places: Place[]; signedIn: boolean }) {
  const t = useTranslations("ai");
  const locale = useLocale();
  const router = useRouter();
  const english = locale === "en";
  const [prompt, setPrompt] = useState(initialPrompt);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("easy");
  const [savedTripId, setSavedTripId] = useState("");
  const [saveTitle, setSaveTitle] = useState(english ? "My Dong Nai trip" : "Chuyến đi Đồng Nai");
  const [days, setDays] = useState("");
  const [partySize, setPartySize] = useState("");
  const [budget, setBudget] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [transport, setTransport] = useState("unknown");
  const [notice, setNotice] = useState("");
  const selectedOption = result?.options.find((option) => option.id === selected) ?? result?.options[0];

  async function planTrip() {
    setError(""); setNotice(""); setLoading(true); setResult(null); setSavedTripId("");
    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), locale, consent, durationDays: days ? Number(days) : undefined, partySize: partySize ? Number(partySize) : undefined, budgetVnd: budget ? Number(budget) : undefined, travelDate: travelDate || undefined, transport: transport === "unknown" ? undefined : transport }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? t("retry"));
      const nextResult = body as Result;
      setResult(nextResult);
      setDays(String(nextResult.intent.durationDays));
      setPartySize(String(nextResult.intent.partySize));
      setBudget(nextResult.intent.budgetVnd === null ? "" : String(nextResult.intent.budgetVnd));
      setTravelDate(nextResult.intent.travelDate ?? "");
      setTransport(nextResult.intent.transport);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("retry"));
    } finally { setLoading(false); }
  }

  async function saveTrip(): Promise<string | null> {
    if (!result || !selectedOption) return null;
    setError(""); setNotice(""); setLoading(true);
    try {
      const response = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        title: saveTitle.trim(), locale,
        intent: result.intent,
        options: result.options,
        selectedOption: selected,
      }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? t("retry"));
      setSavedTripId(body.trip.id);
      setNotice(english ? "Trip saved to your account." : "Đã lưu lịch trình vào tài khoản của bạn.");
      return body.trip.id as string;
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("retry")); }
    finally { setLoading(false); }
    return null;
  }

  async function sendInquiry() {
    const tripId = savedTripId || await saveTrip();
    if (tripId) router.push(`/inquiry?trip=${tripId}`);
  }

  async function shareTrip() {
    if (!savedTripId) { await saveTrip(); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/trips/${savedTripId}/share`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? t("retry"));
      const target = `${window.location.origin}/${locale}/shared#${body.token}`;
      await navigator.clipboard.writeText(target);
      setNotice(english ? "Seven-day read-only link copied. You can revoke it in My trips." : "Đã sao chép liên kết chỉ xem có hiệu lực 7 ngày. Bạn có thể thu hồi trong Lịch trình.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("retry")); }
    finally { setLoading(false); }
  }

  const knownCost = selectedOption?.cost.knownSubtotalVnd;
  const knownCostLabel = knownCost === null || knownCost === undefined
    ? (english ? "Not confirmed" : "Chưa xác nhận")
    : `${knownCost.toLocaleString(english ? "en-US" : "vi-VN")} ₫`;
  const placeNames = useMemo(() => new Set(places.map((place) => place.id)), [places]);
  const normalizedStops = selectedOption?.stops.filter((place) => placeNames.has(place.id)) ?? [];

  return (
    <div className="container section">
      <p className="eyebrow"><Sparkles size={15} />{english ? "AI JOURNEY PLANNER" : "AI LẬP KẾ HOẠCH DU LỊCH"}</p>
      <h1 className="page-title">{t("title")}</h1><p className="section-description">{t("subtitle")}</p>
      {!signedIn && <div className="alert alert-blue" style={{ marginTop: 20 }}><ShieldAlert size={18} /><span>{t("loginRequired")} <Link className="text-link" href="/auth">{t("createAccount")}<ArrowRight size={13} /></Link></span></div>}
      <div className="split-layout" style={{ marginTop: 24 }}>
        <section className="panel">
          <h2 className="panel-title">{t("promptLabel")}</h2>
          <p className="panel-copy">{english ? "Describe dates, group size, preferences and budget. You can edit the suggested preferences after the AI reads your request." : "Mô tả số ngày, nhóm khách, sở thích và ngân sách. Bạn có thể chỉnh ràng buộc sau khi AI đọc yêu cầu."}</p>
          <label className="form-label" htmlFor="trip-prompt">{english ? "Trip request" : "Mô tả chuyến đi"}</label>
          <textarea id="trip-prompt" className="field" rows={6} maxLength={1200} minLength={12} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={t("promptPlaceholder")} disabled={!signedIn || loading} />
          <p className="form-label">{english ? "Review or override trip details" : "Kiểm tra hoặc chỉnh ràng buộc chuyến đi"}</p>
          <div className="intent-fields">
            <label><span>{english ? "Days" : "Số ngày"}</span><input className="field" type="number" min="1" max="3" value={days} onChange={(event) => setDays(event.target.value)} placeholder="1–3" disabled={!signedIn || loading}/></label>
            <label><span>{english ? "Travelers" : "Số khách"}</span><input className="field" type="number" min="1" max="40" value={partySize} onChange={(event) => setPartySize(event.target.value)} placeholder="1–40" disabled={!signedIn || loading}/></label>
            <label><span>{english ? "Budget (VND)" : "Ngân sách (VND)"}</span><input className="field" type="number" min="0" max="500000000" step="1000" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder={english ? "Unknown" : "Chưa xác định"} disabled={!signedIn || loading}/></label>
            <label><span>{english ? "Start date" : "Ngày khởi hành"}</span><input className="field" type="date" value={travelDate} onChange={(event) => setTravelDate(event.target.value)} disabled={!signedIn || loading}/></label>
            <label><span>{english ? "Transport" : "Phương tiện"}</span><select className="field" value={transport} onChange={(event) => setTransport(event.target.value)} disabled={!signedIn || loading}><option value="unknown">{english ? "Not sure" : "Chưa rõ"}</option><option value="car">{english ? "Car" : "Ô tô"}</option><option value="private_vehicle">{english ? "Private vehicle" : "Xe riêng"}</option><option value="motorbike">{english ? "Motorbike" : "Xe máy"}</option><option value="bus">{english ? "Bus" : "Xe buýt/xe khách"}</option><option value="bicycle">{english ? "Bicycle" : "Xe đạp"}</option><option value="walking">{english ? "Walking" : "Đi bộ"}</option></select></label>
          </div>
          <p className="form-hint">{english ? "Do not include names, phone numbers, email addresses or precise live location. The request is sent to the configured AI provider and is not saved until you choose Save." : "Không nhập tên, số điện thoại, email hoặc vị trí chính xác. Yêu cầu được gửi tới nhà cung cấp AI và chưa lưu cho đến khi bạn chọn Lưu."}</p>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 17, color: "#61746b", fontSize: ".78rem", lineHeight: 1.6 }}>
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={!signedIn} style={{ marginTop: 3, accentColor: "#12634b" }} />
            <span>{english ? "I agree to send this trip request to DeepSeek to generate itinerary suggestions. My name, account email and live GPS are not included." : "Tôi đồng ý gửi yêu cầu chuyến đi này tới DeepSeek để tạo gợi ý. Tên, email tài khoản và GPS trực tiếp không được đính kèm."}</span>
          </label>
          {error && <div className="alert alert-red" role="alert" style={{ marginTop: 14 }}><AlertCircle size={17} /><span>{error}</span></div>}
          {notice && <div className="alert" role="status" style={{ marginTop: 14 }}><Check size={17} /><span>{notice}</span></div>}
          <button className="button button-primary" type="button" style={{ width: "100%", marginTop: 18 }} onClick={planTrip} disabled={!signedIn || !consent || loading || prompt.trim().length < 12 || (days !== "" && (!Number.isInteger(Number(days)) || Number(days) < 1 || Number(days) > 3)) || (partySize !== "" && (!Number.isInteger(Number(partySize)) || Number(partySize) < 1 || Number(partySize) > 40)) || (budget !== "" && (!Number.isSafeInteger(Number(budget)) || Number(budget) < 0 || Number(budget) > 500000000))}>
            {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />}{loading ? t("loading") : result ? (english ? "Update suggestions" : "Cập nhật gợi ý") : t("plan")}<ArrowRight size={15} />
          </button>
        </section>
        <aside className="panel">
          <h2 className="panel-title">{t("safetyTitle")}</h2><p className="panel-copy">{t("safetyBody")}</p>
          <div className="alert" style={{ marginTop: 16 }}><CircleDollarSign size={18} /><span>{english ? "Prices are missing or uncertain until a source confirms them. Unknown costs are not counted as free." : "Giá còn thiếu hoặc không chắc đến khi được nguồn xác nhận. Khoản chưa biết không được tính thành miễn phí."}</span></div>
          <div className="alert alert-blue" style={{ marginTop: 12 }}><RouteIcon size={18} /><span>{english ? "Driving distance appears only when the origin and verified entrance coordinates can be routed." : "Quãng đường lái xe chỉ hiển thị khi có điểm đầu và tọa độ cổng vào đã đối chiếu."}</span></div>
          {result && <div className="metric-row"><div className="metric"><span className="metric-label">{english ? "Trip length" : "Số ngày"}</span><strong className="metric-value">{result.intent.durationDays} {english ? "days" : "ngày"}</strong></div><div className="metric"><span className="metric-label">{english ? "Group size" : "Số khách"}</span><strong className="metric-value">{result.intent.partySize}</strong></div><div className="metric"><span className="metric-label">{t("knownTotal")}</span><strong className="metric-value">{knownCostLabel}</strong></div></div>}
        </aside>
      </div>

      {result && <section className="result-area" aria-live="polite">
        <div className="result-heading"><div><p className="eyebrow"><Sparkles size={14} />{english ? "YOUR TRIP OPTIONS" : "PHƯƠNG ÁN GỢI Ý"}</p><h2 className="section-title" style={{ fontSize: "1.75rem" }}>{english ? "Choose a starting point" : "Chọn một hướng để bắt đầu"}</h2></div>{result.demo && <span className="demo-ribbon">{english ? "DEMO DATA" : "DỮ LIỆU DEMO"}</span>}</div>
        <div className="plan-options">{result.options.map((option) => {
          const title = option.id === "easy" ? (english ? "Your interests" : "Theo sở thích") : option.id === "short-drive" ? (english ? "One region" : "Cùng một vùng") : (english ? "More variety" : "Nhiều trải nghiệm");
          return <button className="plan-card" type="button" key={option.id} onClick={() => setSelected(option.id)} aria-pressed={selected === option.id} style={{ textAlign: "left", outline: selected === option.id ? "2px solid #12634b" : undefined, cursor: "pointer" }}>
            <strong>{title}</strong><p className="form-hint" style={{ minHeight: 38 }}>{descriptions[option.id][english ? "en" : "vi"]}</p><span className="status-label"><MapPin size={13} />{option.stops.length} {english ? "destinations" : "địa điểm"}</span>
          </button>;
        })}</div>

        {selectedOption && <>
          <div className="split-layout" style={{ marginTop: 17 }}>
            <section className="panel">
              <div className="result-heading"><h3 className="panel-title">{t("stops")}</h3><div className="action-row"><span className="status-label">{selectedOption.status === "infeasible" ? (english ? "Required stop unavailable" : "Không đáp ứng điểm bắt buộc") : (english ? "Needs confirmation" : "Cần xác nhận")}</span><span className="status-label"><RouteIcon size={14} />{selectedOption.route ? `${selectedOption.route.distanceKm} km · ${selectedOption.route.durationMinutes} ${english ? "min" : "phút"}` : (english ? "Route unverified" : "Tuyến chưa xác minh")}</span></div></div>
              {normalizedStops.length ? normalizedStops.map((place, index) => <div className="itinerary-stop" key={place.id}>
                <span className="itinerary-marker"><span className="plan-stop-number">{index + 1}</span></span>
                <span><strong style={{ fontSize: ".84rem" }}>{english ? place.nameEn : place.name}</strong><p>{english ? place.statusNoteEn : place.statusNote}</p></span>
                <Link className="text-link" aria-label={`${english ? "Details for" : "Chi tiết"} ${english ? place.nameEn : place.name}`} href={`/places/${place.id}`}><ArrowRight size={15} /></Link>
              </div>) : <div className="empty-state">{english ? "No itinerary stops are available for this request." : "Chưa có điểm dừng phù hợp cho yêu cầu này."}</div>}
              {selectedOption.warnings.map((warning) => <div className="alert alert-blue" key={warning} style={{ marginTop: 9 }}><CircleHelp size={15} />{warning}</div>)}
            </section>
            <section className="panel">
              <h3 className="panel-title">{t("risks")}</h3>
              <div className="metric-row"><div className="metric"><span className="metric-label">{t("knownTotal")}</span><strong className="metric-value">{knownCostLabel}</strong></div><div className="metric"><span className="metric-label">{t("unknownCosts")}</span><strong className="metric-value">{selectedOption.cost.unknownCount}</strong></div></div>
              {result.intent.budgetVnd !== null && <div className="alert alert-blue"><CircleDollarSign size={17} /><span>{english ? "Your budget" : "Ngân sách của bạn"}: {result.intent.budgetVnd.toLocaleString(english ? "en-US" : "vi-VN")} ₫. {english ? "There is not enough verified price data to compare the complete trip cost." : "Chưa đủ giá xác minh để so tổng chi phí chuyến đi."}</span></div>}
              <label className="form-label" htmlFor="trip-title">{english ? "Trip title" : "Tên hành trình"}</label><input id="trip-title" className="field" value={saveTitle} maxLength={90} minLength={2} onChange={(event) => setSaveTitle(event.target.value)} />
              <div style={{ display: "grid", gap: 8, marginTop: 15 }}>
                <button className="button button-primary" onClick={saveTrip} disabled={loading || !signedIn || selectedOption.status === "infeasible"}>{t("save")}</button>
                <button className="button button-secondary" onClick={shareTrip} disabled={loading || !signedIn || selectedOption.status === "infeasible"}>{t("share")}</button>
                <button className="button button-quiet" onClick={sendInquiry} disabled={loading || !signedIn || selectedOption.status === "infeasible"}>{t("sendInquiry")}<ArrowRight size={15} /></button>
                {selectedOption.status === "infeasible" && <p className="form-hint">{english ? "Choose another option or revise the mandatory stop before saving or asking for advice." : "Hãy chọn phương án khác hoặc sửa điểm bắt buộc trước khi lưu hay gửi yêu cầu tư vấn."}</p>}
                {!signedIn && <Link className="button button-secondary" href="/auth">{t("createAccount")}</Link>}
              </div>
            </section>
          </div>
          <section className="panel" style={{ marginTop: 17 }}><h3 className="panel-title">{english ? "Map preview" : "Bản đồ hành trình"}</h3><p className="panel-copy">{english ? "Mapped place features are not verified entrances. A driving route appears only when every entrance is verified." : "Đối tượng địa điểm trên bản đồ chưa phải cổng vào đã xác minh. Chỉ hiện tuyến lái xe khi mọi cổng vào đều được đối chiếu."}</p><div style={{ marginTop: 14 }}><ExploreMapLoader places={selectedOption.stops} route={selectedOption.route} /></div></section>
          <PackingAssistant signedIn={signedIn} intent={result.intent} placeIds={normalizedStops.map((place) => place.id)} />
        </>}
      </section>}
    </div>
  );
}
