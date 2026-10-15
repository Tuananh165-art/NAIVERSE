"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, Copy, Pencil, Printer, Trash2 } from "lucide-react";
import { Link } from "@/i18n/routing";
type Trip = { id: string; title: string; locale: string; trip_intent: { durationDays?: number; partySize?: number }; plan_data: { selectedOption?: string; options?: Array<{ id: string; stops: Array<{ name: string; nameEn: string }> }> }; updated_at: string; shares?: Array<{ id: string; expires_at: string }> };
type Inquiry = { id: string; trip_id: string | null; status: string; is_demo: boolean; created_at: string; quotes?: Array<{ id: string; status: string; items: Array<{ label: string; quantity: number; unitPriceVnd: number | null }>; terms: string }> };
export function TripsDashboard() {
  const locale = useLocale(); const en = locale === "en";
  const [trips, setTrips] = useState<Trip[]>([]); const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [error, setError] = useState(""); const [busy, setBusy] = useState("");
  const refresh = useCallback(async () => {
    setError("");
    const [tripResponse, inquiryResponse] = await Promise.all([fetch("/api/trips", { cache: "no-store" }), fetch("/api/inquiries", { cache: "no-store" })]);
    const tripBody = await tripResponse.json(); const inquiryBody = await inquiryResponse.json();
    if (!tripResponse.ok || !inquiryResponse.ok) { setError(en ? "Could not load your account data. Check Supabase setup." : "Không tải được dữ liệu tài khoản. Hãy kiểm tra cấu hình Supabase."); return; }
    const tripsWithShares = await Promise.all((tripBody.trips as Trip[]).map(async (trip) => {
      const response = await fetch("/api/trips/" + trip.id + "/share", { cache: "no-store" });
      const body = response.ok ? await response.json() : { shares: [] };
      return { ...trip, shares: body.shares ?? [] };
    }));
    setTrips(tripsWithShares); setInquiries(inquiryBody.inquiries);
  }, [en]);
  useEffect(() => { let active = true; void Promise.resolve().then(async () => { if (active) await refresh(); }); return () => { active = false; }; }, [refresh]);
  async function remove(id: string) {
    if (!window.confirm(en ? "Delete this trip and its share links? Any submitted request keeps its own snapshot." : "Xóa chuyến đi và các liên kết chia sẻ? Yêu cầu đã gửi vẫn giữ ảnh chụp riêng.")) return;
    setBusy(id); const response = await fetch("/api/trips/" + id, { method: "DELETE" }); setBusy("");
    if (!response.ok) setError(en ? "Trip could not be deleted." : "Không xóa được chuyến đi."); else await refresh();
  }
  async function share(id: string) {
    setBusy(id); const response = await fetch("/api/trips/" + id + "/share", { method: "POST" }); const body = await response.json(); setBusy("");
    if (!response.ok) { setError(body.error?.message ?? "Share link unavailable."); return; }
    await navigator.clipboard.writeText(window.location.origin + "/" + locale + "/shared#" + body.token);
    window.alert(en ? "Read-only link copied. It expires in seven days." : "Đã sao chép liên kết chỉ xem, hết hạn sau bảy ngày.");
  }
  async function revoke(tripId: string, shareId: string) {
    setBusy(shareId); const response = await fetch("/api/trips/" + tripId + "/share/" + shareId, { method: "DELETE" }); setBusy("");
    if (!response.ok) setError(en ? "Share link could not be revoked." : "Không thu hồi được liên kết."); else await refresh();
  }
  async function rename(trip: Trip) {
    const title = window.prompt(en ? "New trip title" : "Tên hành trình mới", trip.title);
    if (!title || title.trim() === trip.title) return;
    setBusy(trip.id); const response = await fetch("/api/trips/" + trip.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) }); setBusy("");
    if (!response.ok) setError(en ? "Trip could not be renamed." : "Không đổi được tên hành trình."); else await refresh();
  }
  async function clone(trip: Trip) {
    const option = trip.plan_data.options?.find((item) => item.id === trip.plan_data.selectedOption) ?? trip.plan_data.options?.[0];
    if (!option || !trip.plan_data.options) return;
    setBusy(trip.id); const response = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: (en ? "Copy of " : "Bản sao - ") + trip.title, locale, intent: trip.trip_intent, options: trip.plan_data.options, selectedOption: option.id }) }); setBusy("");
    if (!response.ok) setError(en ? "Trip could not be copied." : "Không sao chép được hành trình."); else await refresh();
  }
  const status = (value: string) => ({ new: en ? "New" : "Mới", in_review: en ? "In review" : "Đang xem xét", quoted: en ? "Reply ready" : "Đã có phản hồi", closed: en ? "Closed" : "Đã đóng", cancelled: en ? "Cancelled" : "Đã hủy" }[value] ?? value);
  return <div className="container section"><p className="eyebrow">{en ? "YOUR ACCOUNT" : "TÀI KHOẢN CỦA BẠN"}</p><h1 className="page-title">{en ? "My trips & requests" : "Lịch trình và yêu cầu của tôi"}</h1><p className="section-description">{en ? "Private trips are visible only to you. A consultation request shares the selected trip snapshot and contact information with the named recipient." : "Chuyến đi riêng chỉ bạn xem được. Khi gửi yêu cầu tư vấn, ảnh chụp hành trình đã chọn và thông tin liên hệ sẽ được chia sẻ với đơn vị nhận được nêu rõ."}</p>
    {error && <div role="alert" className="alert alert-red" style={{ marginTop: 18 }}>{error}</div>}
    <div className="result-heading" style={{ marginTop: 28 }}><h2 className="section-title" style={{ fontSize: "1.5rem" }}>{en ? "Saved trips" : "Chuyến đi đã lưu"}</h2><Link className="button button-primary" href="/journey">{en ? "Plan a trip" : "Lập hành trình"}<ArrowRight size={15}/></Link></div>
    {!trips.length ? <div className="empty-state">{en ? "No saved trips yet." : "Bạn chưa lưu chuyến đi nào."}</div> : <div className="place-grid">{trips.map((trip) => {
      const option = trip.plan_data.options?.find((item) => item.id === trip.plan_data.selectedOption) ?? trip.plan_data.options?.[0];
      return <article className="place-card" key={trip.id}><div className="place-card-content"><span className="status-label">{trip.trip_intent.durationDays ?? 1} {en ? "days" : "ngày"} · {trip.trip_intent.partySize ?? 1} {en ? "travelers" : "khách"}</span><h3>{trip.title}</h3><p>{option?.stops.map((stop) => en ? stop.nameEn : stop.name).join(" · ") ?? (en ? "Saved trip details" : "Chi tiết hành trình đã lưu")}</p><small className="form-hint">{new Date(trip.updated_at).toLocaleString(en ? "en-US" : "vi-VN")}</small><div className="action-row"><button className="button button-secondary" disabled={busy === trip.id} onClick={() => void share(trip.id)}><Copy size={15}/>{en ? "Share" : "Chia sẻ"}</button><button className="button button-quiet" disabled={busy === trip.id} onClick={() => void rename(trip)} aria-label={en ? "Rename trip" : "Đổi tên hành trình"}><Pencil size={15}/></button><button className="button button-quiet" disabled={busy === trip.id} onClick={() => void clone(trip)}>{en ? "Copy" : "Sao chép"}</button><button className="button button-quiet" onClick={() => window.print()} aria-label={en ? "Print trip list" : "In danh sách chuyến đi"}><Printer size={15}/></button><Link className="button button-quiet" href={"/inquiry?trip=" + trip.id}>{en ? "Ask for advice" : "Gửi yêu cầu"}</Link><button className="button button-quiet" disabled={busy === trip.id} onClick={() => void remove(trip.id)} aria-label={en ? "Delete trip" : "Xóa chuyến đi"}><Trash2 size={16}/></button></div>{(trip.shares ?? []).map((shareItem) => <div className="form-hint" key={shareItem.id}>{en ? "Link expires" : "Liên kết hết hạn"} {new Date(shareItem.expires_at).toLocaleString(en ? "en-US" : "vi-VN")} <button className="text-link" onClick={() => void revoke(trip.id, shareItem.id)}>{en ? "Revoke" : "Thu hồi"}</button></div>)}</div></article>;
    })}</div>}
    <section className="section-sm"><h2 className="section-title" style={{ fontSize: "1.5rem" }}>{en ? "Consultation updates" : "Cập nhật tư vấn"}</h2>{!inquiries.length ? <div className="empty-state">{en ? "No requests have been sent." : "Chưa gửi yêu cầu tư vấn."}</div> : <div className="panel">{inquiries.map((item) => <div className="itinerary-stop" key={item.id}><span className="itinerary-marker"/><span style={{ flex: 1 }}><strong>{status(item.status)} {item.is_demo && <span className="demo-ribbon">DEMO</span>}</strong><p>{new Date(item.created_at).toLocaleString(en ? "en-US" : "vi-VN")}</p>{(item.quotes ?? []).filter((quote) => quote.status === "shared").map((quote) => <div className="alert" key={quote.id} style={{ marginTop: 7 }}>{quote.items.map((line) => line.label + ": " + (line.unitPriceVnd === null ? (en ? "price to confirm" : "giá cần xác nhận") : line.unitPriceVnd.toLocaleString(en ? "en-US" : "vi-VN") + " ₫")).join(" · ")}<br/>{quote.terms}</div>)}</span>{item.trip_id && <Link className="button button-quiet" href={"/inquiry?trip=" + item.trip_id}>{en ? "Open trip" : "Mở chuyến"}</Link>}</div>)}</div>}</section>
  </div>;
}
