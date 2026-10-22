"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { AlertCircle, ArrowDown, LoaderCircle, MapPin, Route as RouteIcon, Sparkles, Trash2 } from "lucide-react";
import { RoutePickerMapLoader } from "@/components/route-picker-map-loader";
import type { RoutePin } from "@/components/route-picker-map";
import type { RouteResult } from "@/lib/route";

type ResponseData = {
  advice: { recommendation: "fastest" | "shortest"; explanation: string; tradeoffs: string[]; reminders: string[] };
  selectedProfile: "fastest" | "shortest";
  routes: { fastest: RouteResult | null; shortest: RouteResult | null };
  waypointOrder: Array<RoutePin & { originalIndex: number }>;
  optimization: { applied: boolean; objective: "duration" | "distance"; estimatedDistanceKm?: number; estimatedDurationMinutes?: number; anchorsFixed: boolean };
  source: { label: string; url: string; fetchedAt: string };
  limits: string[];
};

export function AiRouteAssist({ signedIn }: { signedIn: boolean }) {
  const locale = useLocale();
  const en = locale === "en";
  const [pins, setPins] = useState<RoutePin[]>([]);
  const [purpose, setPurpose] = useState("fastest");
  const [partySize, setPartySize] = useState("2");
  const [childSeatNeeded, setChildSeatNeeded] = useState(false);
  const [departureTime, setDepartureTime] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResponseData | null>(null);

  function addPin(latitude: number, longitude: number) {
    if (pins.length >= 8) return;
    setResult(null);
    setPins((current) => [...current, { name: `${en ? "Stop" : "Điểm"} ${current.length + 1}`, latitude: Number(latitude.toFixed(5)), longitude: Number(longitude.toFixed(5)) }]);
  }
  function rename(index: number, name: string) { setResult(null); setPins((items) => items.map((pin, i) => i === index ? { ...pin, name } : pin)); }
  function removePin(index: number) { setResult(null); setPins((items) => items.filter((_, i) => i !== index).map((pin, i) => ({ ...pin, name: pin.name.replace(/\d+$/, String(i + 1)) }))); }

  async function compare() {
    setError(""); setResult(null); setLoading(true);
    try {
      const response = await fetch("/api/ai/route-assist", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, consent, purpose, partySize: Number(partySize), childSeatNeeded, departureTime: departureTime ? new Date(departureTime).toISOString() : undefined, stops: pins }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? (en ? "Could not compare routes." : "Chưa so sánh được tuyến."));
      setResult(body as ResponseData);
    } catch (cause) { setError(cause instanceof Error ? cause.message : (en ? "Please retry." : "Vui lòng thử lại.")); }
    finally { setLoading(false); }
  }

  const selected = result?.routes[result.selectedProfile] ?? null;
  const plottedFastest = useMemo(() => result?.routes.fastest?.geometry, [result]);
  const plottedShortest = useMemo(() => result?.routes.shortest?.geometry, [result]);

  return <div className="container section">
    <p className="eyebrow"><RouteIcon size={15}/>{en ? "AI ROUTE & MOVEMENT" : "AI GIAO THÔNG VÀ HÀNH TRÌNH DI CHUYỂN"}</p>
    <h1 className="page-title">{en ? "Compare road routes" : "So sánh tuyến đường"}</h1>
    <p className="section-description">{en ? "Add map pins, then compare road estimates and optimize the order of intermediate stops. AI explains the tradeoffs using provider metrics." : "Chọn các điểm trên bản đồ, so sánh ước lượng đường bộ và tối ưu thứ tự các điểm trung gian. AI giải thích đánh đổi từ số liệu nhà cung cấp."}</p>
    <div className="alert alert-blue" style={{ marginTop: 20 }}>{en ? "The provider returns road-network estimates, not live congestion, transit timetables, verified venue entrances, parking or road closures. Pins are kept only in this browser/request." : "Nhà cung cấp trả ước lượng theo mạng đường, không có kẹt xe trực tiếp, giờ xe công cộng, cổng điểm đến đã xác minh, bãi đỗ hay đường đóng. Ghim chỉ giữ trong trình duyệt/yêu cầu này."}</div>
    <div className="split-layout" style={{ marginTop: 22 }}>
      <section className="panel">
        <h2 className="panel-title">{en ? "Route map" : "Bản đồ chọn điểm"}</h2>
        <p className="form-hint">{en ? "Click to add 2–8 waypoints. After comparison, the route line follows the suggested order; the first and last stops stay fixed." : "Nhấp bản đồ để thêm 2–8 điểm. Sau khi so sánh, đường tuyến đi theo thứ tự gợi ý; điểm đầu và cuối được giữ cố định."}</p>
        <RoutePickerMapLoader pins={pins} onAdd={addPin} fastest={plottedFastest} shortest={plottedShortest}/>
        <p className="form-hint">{en ? "Blue: fastest profile · Green dashed: shortest profile" : "Xanh dương: tuyến nhanh · Xanh lá đứt nét: tuyến ngắn"} · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></p>
        <ol className="route-pins">{pins.map((pin, index) => <li key={`${index}-${pin.latitude}-${pin.longitude}`}><span className="route-pin-number">{index + 1}</span><input className="field" aria-label={en ? `Waypoint ${index + 1} name` : `Tên điểm ${index + 1}`} value={pin.name} maxLength={100} onChange={(event) => rename(index, event.target.value)}/><span className="form-hint">{pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}</span><button className="button button-quiet" type="button" aria-label={en ? "Remove waypoint" : "Xóa điểm"} onClick={() => removePin(index)}><Trash2 size={15}/></button></li>)}</ol>
        {pins.length < 2 && <div className="empty-state">{en ? "Click two points on the map to begin." : "Nhấp chọn ít nhất hai điểm trên bản đồ."}</div>}
        {pins.length > 1 && pins.length < 8 && <button type="button" className="button button-secondary" onClick={() => addPin(pins.at(-1)!.latitude, pins.at(-1)!.longitude)}><MapPin size={15}/>{en ? "Duplicate last pin to adjust" : "Thêm điểm gần vị trí cuối"}</button>}
      </section>
      <section className="panel">
        <h2 className="panel-title">{en ? "Travel priorities" : "Ưu tiên hành trình"}</h2>
        <label className="form-label" htmlFor="route-purpose">{en ? "Optimize for" : "Ưu tiên"}</label>
        <select id="route-purpose" className="field" value={purpose} onChange={(event) => { setPurpose(event.target.value); setResult(null); }}><option value="fastest">{en ? "Less estimated time" : "Ít thời gian ước tính"}</option><option value="shortest">{en ? "Fewer kilometers" : "Ít km hơn"}</option><option value="easy">{en ? "Simple trip (fastest estimate)" : "Hành trình đơn giản (tuyến nhanh)"}</option><option value="avoid_night">{en ? "Avoid late arrival (needs departure time)" : "Tránh đến muộn (cần giờ khởi hành)"}</option><option value="green">{en ? "Lower-distance proxy" : "Ưu tiên quãng đường ngắn"}</option></select>
        <div className="intent-fields" style={{ marginTop: 14 }}><label><span>{en ? "Travelers" : "Số khách"}</span><input className="field" type="number" min="1" max="40" value={partySize} onChange={(event) => { setPartySize(event.target.value); setResult(null); }}/></label><label><span>{en ? "Departure time (optional)" : "Giờ khởi hành (tùy chọn)"}</span><input className="field" type="datetime-local" value={departureTime} onChange={(event) => { setDepartureTime(event.target.value); setResult(null); }}/></label></div>
        <label className="form-hint" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}><input type="checkbox" checked={childSeatNeeded} onChange={(event) => { setChildSeatNeeded(event.target.checked); setResult(null); }}/><span>{en ? "Traveling with a child: remind me to confirm a suitable child seat." : "Có trẻ em: nhắc tôi xác nhận ghế trẻ em phù hợp."}</span></label>
        <label className="form-hint" style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12 }}><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setResult(null); }}/><span>{en ? "I agree to send the stop names and route metrics to AI for explanation. Exact coordinates go to OpenRouteService only." : "Tôi đồng ý gửi tên điểm và số liệu tuyến đến AI để giải thích. Tọa độ chỉ gửi OpenRouteService."}</span></label>
        {!signedIn && <p className="form-hint">{en ? "Sign in is required for AI route advice." : "Cần đăng nhập để dùng AI định tuyến."}</p>}
        {error && <div role="alert" className="alert alert-red" style={{ marginTop: 12 }}><AlertCircle size={16}/>{error}</div>}
        <button type="button" className="button button-primary" style={{ width: "100%", marginTop: 14 }} onClick={compare} disabled={!signedIn || !consent || pins.length < 2 || pins.length > 8 || loading || pins.some((pin) => pin.name.trim().length < 2)}>{loading ? <LoaderCircle size={17} className="animate-spin"/> : <Sparkles size={17}/>} {loading ? (en ? "Comparing…" : "Đang so sánh…") : (en ? "Compare routes with AI" : "So sánh tuyến bằng AI")}</button>
        {result && selected && <div style={{ marginTop: 22 }}><h3 className="panel-title">{en ? "Recommended route" : "Tuyến được gợi ý"} <ArrowDown size={16}/></h3><p>{result.advice.explanation}</p><div className="metric-row"><div className="metric"><span className="metric-label">{en ? "Distance" : "Quãng đường"}</span><strong className="metric-value">{selected.distanceKm} km</strong></div><div className="metric"><span className="metric-label">{en ? "Estimated drive" : "Thời gian lái ước tính"}</span><strong className="metric-value">{selected.durationMinutes} {en ? "min" : "phút"}</strong></div></div><h4 className="panel-title" style={{ marginTop: 16, fontSize: "1rem" }}>{en ? "Suggested stop order" : "Thứ tự điểm gợi ý"}</h4><ol className="check-list">{result.waypointOrder.map((stop, index) => <li key={`${stop.originalIndex}-${stop.latitude}-${stop.longitude}`}>{stop.name}{index === 0 ? (en ? " · start" : " · điểm đầu") : index === result.waypointOrder.length - 1 ? (en ? " · destination" : " · điểm cuối") : ""}</li>)}</ol>{result.optimization.applied && <p className="form-hint">{en ? `Matrix estimate (${result.optimization.objective}): ${result.optimization.estimatedDistanceKm} km · ${result.optimization.estimatedDurationMinutes} min; endpoints kept fixed.` : `Ước lượng ma trận (${result.optimization.objective === "distance" ? "quãng đường" : "thời gian"}): ${result.optimization.estimatedDistanceKm} km · ${result.optimization.estimatedDurationMinutes} phút; giữ cố định điểm đầu/cuối.`}</p>}{result.optimization.applied && result.waypointOrder.some((stop, index) => stop.originalIndex !== index) && <button className="button button-secondary" type="button" onClick={() => setPins(result.waypointOrder.map((stop) => pins[stop.originalIndex]))}>{en ? "Use suggested order" : "Áp dụng thứ tự gợi ý"}</button>}<ul className="check-list">{[...result.advice.tradeoffs, ...result.advice.reminders, ...result.limits].map((item, i) => <li key={i}>{item}</li>)}</ul><p className="form-hint"><a className="text-link" href={result.source.url} target="_blank" rel="noreferrer">{en ? "Open route data source" : "Mở nguồn dữ liệu tuyến"}</a> · {new Date(result.source.fetchedAt).toLocaleString(en ? "en-US" : "vi-VN")}</p></div>}
      </section>
    </div>
  </div>;
}
