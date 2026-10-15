"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "next-intl";
import { Check, ImagePlus, LoaderCircle, Plus, Trash2 } from "lucide-react";

type PlaceOption = { id: string; name: string; name_en: string };
type MediaRecord = { id: string; place_id: string; image_url: string; alt_vi: string; alt_en: string; credit: string; source_url: string; license: string; license_url: string; checked_at: string; is_archival: boolean; approved: boolean };
type HoursRecord = { id: string; place_id: string; weekday: number; opens_local: string | null; closes_local: string | null; status: string; note: string; note_en: string; valid_from: string | null; valid_to: string | null; source_url: string | null; source_label: string; checked_at: string | null; approved: boolean };
type PriceRecord = { id: string; place_id: string; item_label: string; audience: string; amount_vnd: number | null; status: string; valid_from: string | null; valid_to: string | null; source_url: string | null; source_label: string; checked_at: string | null; terms: string; demo_label: string | null; approved: boolean };
type Props = { places: PlaceOption[]; media: MediaRecord[]; hours: HoursRecord[]; prices: PriceRecord[]; onRefresh: () => Promise<void> };
type RecordType = "media" | "hours" | "price";

const weekdayNames = {
  vi: ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export function AdminEvidenceManager({ places, media, hours, prices, onRefresh }: Props) {
  const en = useLocale() === "en";
  const [placeId, setPlaceId] = useState(places[0]?.id ?? "");
  const [type, setType] = useState<RecordType>("media");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState({ imageUrl: "", altVi: "", altEn: "", credit: "", sourceUrl: "", license: "", licenseUrl: "", checkedAt: "", isArchival: false });
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [schedule, setSchedule] = useState({ opensLocal: "", closesLocal: "", status: "unknown", note: "", noteEn: "", validFrom: "", validTo: "", sourceUrl: "", sourceLabel: "", checkedAt: "" });
  const [price, setPrice] = useState({ itemLabel: "", audience: "", amountVnd: "", status: "unknown", validFrom: "", validTo: "", sourceUrl: "", sourceLabel: "", checkedAt: "", terms: "", demoLabel: "" });
  const activePlaceId = places.some((place) => place.id === placeId) ? placeId : (places[0]?.id ?? "");
  const selected = places.find((place) => place.id === activePlaceId);
  const selectedMedia = media.filter((record) => record.place_id === activePlaceId);
  const selectedHours = hours.filter((record) => record.place_id === activePlaceId);
  const selectedPrices = prices.filter((record) => record.place_id === activePlaceId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!activePlaceId) return;
    setBusy("save"); setError(""); setMessage("");
    let payload: Record<string, unknown>;
    if (type === "media") {
      payload = { type, placeId: activePlaceId, ...photo };
    } else if (type === "hours") {
      payload = { type, placeId: activePlaceId, weekdays, opensLocal: schedule.opensLocal || null, closesLocal: schedule.closesLocal || null, status: schedule.status, note: schedule.note, noteEn: schedule.noteEn, validFrom: schedule.validFrom || null, validTo: schedule.validTo || null, sourceUrl: schedule.sourceUrl || null, sourceLabel: schedule.sourceLabel, checkedAt: schedule.checkedAt || null };
    } else {
      payload = { type, placeId: activePlaceId, itemLabel: price.itemLabel, audience: price.audience, amountVnd: price.amountVnd.trim() ? Number(price.amountVnd) : null, status: price.status, validFrom: price.validFrom || null, validTo: price.validTo || null, sourceUrl: price.sourceUrl || null, sourceLabel: price.sourceLabel, checkedAt: price.checkedAt || null, terms: price.terms, demoLabel: price.demoLabel || null };
    }
    try {
      const response = await fetch("/api/admin/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? (en ? "Could not save evidence." : "Không lưu được bằng chứng."));
      setMessage(en ? "Evidence saved as pending review; it is not public yet." : "Đã lưu bản ghi chờ duyệt; dữ liệu chưa xuất hiện công khai.");
      if (type === "media") setPhoto({ imageUrl: "", altVi: "", altEn: "", credit: "", sourceUrl: "", license: "", licenseUrl: "", checkedAt: "", isArchival: false });
      if (type === "hours") setSchedule({ opensLocal: "", closesLocal: "", status: "unknown", note: "", noteEn: "", validFrom: "", validTo: "", sourceUrl: "", sourceLabel: "", checkedAt: "" });
      if (type === "price") setPrice({ itemLabel: "", audience: "", amountVnd: "", status: "unknown", validFrom: "", validTo: "", sourceUrl: "", sourceLabel: "", checkedAt: "", terms: "", demoLabel: "" });
      await onRefresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (en ? "Could not save evidence." : "Không lưu được bằng chứng."));
    } finally { setBusy(""); }
  }

  async function approve(recordType: RecordType, id: string, approved: boolean) {
    setBusy(id); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/places", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: recordType, id, approved }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? (en ? "Review action failed." : "Không cập nhật được trạng thái duyệt."));
      setMessage(approved ? (en ? "Record approved and public." : "Đã duyệt, bản ghi được công khai.") : (en ? "Record withdrawn from public display." : "Đã gỡ bản ghi khỏi hiển thị công khai."));
      await onRefresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (en ? "Review action failed." : "Không cập nhật được trạng thái duyệt."));
    } finally { setBusy(""); }
  }

  async function remove(recordType: RecordType, id: string) {
    const accepted = window.confirm(en ? "Permanently delete this evidence record?" : "Xóa vĩnh viễn bản ghi bằng chứng này?");
    if (!accepted) return;
    setBusy(id); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/places?type=${recordType}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? (en ? "Could not delete record." : "Không xóa được bản ghi."));
      setMessage(en ? "Evidence record deleted." : "Đã xóa bản ghi bằng chứng.");
      await onRefresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (en ? "Could not delete record." : "Không xóa được bản ghi."));
    } finally { setBusy(""); }
  }

  function renderRecordActions(recordType: RecordType, record: { id: string; approved: boolean }) {
    return <div className="action-row" style={{ marginTop: 10 }}>
      <button type="button" className="button button-secondary" disabled={busy === record.id} onClick={() => void approve(recordType, record.id, !record.approved)}><Check size={15}/>{record.approved ? (en ? "Withdraw" : "Gỡ công khai") : (en ? "Approve" : "Duyệt")}</button>
      <button type="button" className="button button-quiet" disabled={busy === record.id} onClick={() => void remove(recordType, record.id)}><Trash2 size={15}/>{en ? "Delete" : "Xóa"}</button>
    </div>;
  }

  return <section className="section-sm" aria-labelledby="evidence-manager-title">
    <h2 id="evidence-manager-title" className="section-title" style={{ fontSize: "1.5rem" }}>{en ? "Photos, opening hours and prices" : "Ảnh, giờ hoạt động và giá"}</h2>
    <p className="form-hint">{en ? "Every record needs its original source. New records are private until a platform administrator approves them. Keep unknown prices blank and use historical/conflicting labels when needed." : "Mỗi bản ghi cần nguồn gốc. Dữ liệu mới ở trạng thái chờ duyệt và chưa công khai. Để giá chưa biết ở dạng trống; ghi rõ lịch sử hoặc xung đột khi phù hợp."}</p>
    {error && <div className="alert alert-red" role="alert" style={{ marginTop: 12 }}>{error}</div>}{message && <div className="alert" role="status" style={{ marginTop: 12 }}>{message}</div>}
    <div className="panel" style={{ marginTop: 16 }}>
      <label className="form-label" htmlFor="evidence-place">{en ? "Place" : "Địa điểm"}</label>
      <select id="evidence-place" className="field" value={activePlaceId} onChange={(event) => setPlaceId(event.target.value)}>{places.map((place) => <option key={place.id} value={place.id}>{en ? place.name_en : place.name}</option>)}</select>
      <div className="button-row" style={{ marginTop: 14 }}>
        <button type="button" className={type === "media" ? "button button-primary" : "button button-secondary"} onClick={() => setType("media")}><ImagePlus size={15}/>{en ? "Photo" : "Ảnh"}</button>
        <button type="button" className={type === "hours" ? "button button-primary" : "button button-secondary"} onClick={() => setType("hours")}>{en ? "Hours" : "Giờ"}</button>
        <button type="button" className={type === "price" ? "button button-primary" : "button button-secondary"} onClick={() => setType("price")}>{en ? "Price" : "Giá"}</button>
      </div>

      <form onSubmit={(event) => void submit(event)} style={{ marginTop: 16 }}>
        {type === "media" && <div className="intent-fields">
          <label>{en ? "Image URL" : "URL ảnh"}<input className="field" type="url" required maxLength={2048} value={photo.imageUrl} onChange={(event) => setPhoto({ ...photo, imageUrl: event.target.value })}/></label>
          <label>{en ? "Image source page" : "Trang nguồn ảnh"}<input className="field" type="url" required maxLength={2048} value={photo.sourceUrl} onChange={(event) => setPhoto({ ...photo, sourceUrl: event.target.value })}/></label>
          <label>{en ? "Vietnamese alt text" : "Mô tả ảnh tiếng Việt"}<input className="field" required maxLength={240} value={photo.altVi} onChange={(event) => setPhoto({ ...photo, altVi: event.target.value })}/></label>
          <label>{en ? "English alt text" : "Mô tả ảnh tiếng Anh"}<input className="field" required maxLength={240} value={photo.altEn} onChange={(event) => setPhoto({ ...photo, altEn: event.target.value })}/></label>
          <label>{en ? "Creator / credit" : "Tác giả / ghi công"}<input className="field" required maxLength={160} value={photo.credit} onChange={(event) => setPhoto({ ...photo, credit: event.target.value })}/></label>
          <label>{en ? "License" : "Giấy phép"}<input className="field" required maxLength={80} placeholder="CC BY-SA 4.0" value={photo.license} onChange={(event) => setPhoto({ ...photo, license: event.target.value })}/></label>
          <label>{en ? "License terms URL" : "URL điều khoản giấy phép"}<input className="field" type="url" required maxLength={2048} value={photo.licenseUrl} onChange={(event) => setPhoto({ ...photo, licenseUrl: event.target.value })}/></label>
          <label>{en ? "Date checked" : "Ngày kiểm tra"}<input className="field" type="date" required value={photo.checkedAt} onChange={(event) => setPhoto({ ...photo, checkedAt: event.target.value })}/></label>
          <label className="form-hint"><input type="checkbox" checked={photo.isArchival} onChange={(event) => setPhoto({ ...photo, isArchival: event.target.checked })}/> {en ? "Archival image; label its date/context" : "Ảnh tư liệu; ghi rõ thời điểm/bối cảnh"}</label>
        </div>}
        {type === "hours" && <>
          <fieldset className="panel" style={{ margin: "0 0 14px", padding: 12 }}><legend className="form-label">{en ? "Weekdays" : "Các ngày trong tuần"}</legend><div className="button-row">{weekdayNames[en ? "en" : "vi"].map((name, weekday) => <label key={weekday} className="form-hint"><input type="checkbox" checked={weekdays.includes(weekday)} onChange={(event) => setWeekdays((current) => event.target.checked ? [...current, weekday].sort() : current.filter((day) => day !== weekday))}/> {name}</label>)}</div></fieldset>
          <div className="intent-fields">
            <label>{en ? "Opens (leave blank if unknown)" : "Giờ mở (để trống nếu chưa biết)"}<input className="field" type="time" value={schedule.opensLocal} onChange={(event) => setSchedule({ ...schedule, opensLocal: event.target.value })}/></label>
            <label>{en ? "Closes (leave blank if unknown)" : "Giờ đóng (để trống nếu chưa biết)"}<input className="field" type="time" value={schedule.closesLocal} onChange={(event) => setSchedule({ ...schedule, closesLocal: event.target.value })}/></label>
            <label>{en ? "Evidence status" : "Trạng thái bằng chứng"}<select className="field" value={schedule.status} onChange={(event) => setSchedule({ ...schedule, status: event.target.value })}><option value="unknown">{en ? "Unknown" : "Chưa xác minh"}</option><option value="verified">{en ? "Verified" : "Đã xác minh"}</option><option value="historical">{en ? "Historical" : "Lịch sử"}</option><option value="conflicting">{en ? "Conflicting" : "Mâu thuẫn"}</option></select></label>
            <label>{en ? "Source name" : "Tên nguồn"}<input className="field" required maxLength={200} value={schedule.sourceLabel} onChange={(event) => setSchedule({ ...schedule, sourceLabel: event.target.value })}/></label>
            <label>{en ? "Source URL (required for verified)" : "URL nguồn (bắt buộc nếu xác minh)"}<input className="field" type="url" maxLength={2048} value={schedule.sourceUrl} onChange={(event) => setSchedule({ ...schedule, sourceUrl: event.target.value })}/></label>
            <label>{en ? "Date checked" : "Ngày kiểm tra"}<input className="field" type="date" value={schedule.checkedAt} onChange={(event) => setSchedule({ ...schedule, checkedAt: event.target.value })}/></label>
            <label>{en ? "Valid from" : "Hiệu lực từ"}<input className="field" type="date" value={schedule.validFrom} onChange={(event) => setSchedule({ ...schedule, validFrom: event.target.value })}/></label>
            <label>{en ? "Valid to" : "Hiệu lực đến"}<input className="field" type="date" value={schedule.validTo} onChange={(event) => setSchedule({ ...schedule, validTo: event.target.value })}/></label>
          </div>
          <label className="form-label">{en ? "Vietnamese note" : "Ghi chú tiếng Việt"}</label><textarea className="field" rows={2} maxLength={1000} value={schedule.note} onChange={(event) => setSchedule({ ...schedule, note: event.target.value })}/>
          <label className="form-label">{en ? "English note" : "Ghi chú tiếng Anh"}</label><textarea className="field" rows={2} maxLength={1000} value={schedule.noteEn} onChange={(event) => setSchedule({ ...schedule, noteEn: event.target.value })}/>
        </>}
        {type === "price" && <div className="intent-fields">
          <label>{en ? "Ticket/service" : "Vé/dịch vụ"}<input className="field" required maxLength={140} value={price.itemLabel} onChange={(event) => setPrice({ ...price, itemLabel: event.target.value })}/></label>
          <label>{en ? "Eligible audience" : "Đối tượng áp dụng"}<input className="field" required maxLength={160} value={price.audience} onChange={(event) => setPrice({ ...price, audience: event.target.value })}/></label>
          <label>{en ? "Amount in VND (blank if unknown)" : "Giá VND (để trống nếu chưa biết)"}<input className="field" type="number" min="0" max="500000000" step="1" value={price.amountVnd} onChange={(event) => setPrice({ ...price, amountVnd: event.target.value })}/></label>
          <label>{en ? "Evidence status" : "Trạng thái bằng chứng"}<select className="field" value={price.status} onChange={(event) => setPrice({ ...price, status: event.target.value })}><option value="unknown">{en ? "Unknown" : "Chưa xác minh"}</option><option value="verified">{en ? "Verified" : "Đã xác minh"}</option><option value="historical">{en ? "Historical" : "Lịch sử"}</option><option value="conflicting">{en ? "Conflicting" : "Mâu thuẫn"}</option></select></label>
          <label>{en ? "Source name" : "Tên nguồn"}<input className="field" required maxLength={200} value={price.sourceLabel} onChange={(event) => setPrice({ ...price, sourceLabel: event.target.value })}/></label>
          <label>{en ? "Source URL (required for verified)" : "URL nguồn (bắt buộc nếu xác minh)"}<input className="field" type="url" maxLength={2048} value={price.sourceUrl} onChange={(event) => setPrice({ ...price, sourceUrl: event.target.value })}/></label>
          <label>{en ? "Date checked" : "Ngày kiểm tra"}<input className="field" type="date" value={price.checkedAt} onChange={(event) => setPrice({ ...price, checkedAt: event.target.value })}/></label>
          <label>{en ? "Valid from" : "Hiệu lực từ"}<input className="field" type="date" value={price.validFrom} onChange={(event) => setPrice({ ...price, validFrom: event.target.value })}/></label>
          <label>{en ? "Valid to" : "Hiệu lực đến"}<input className="field" type="date" value={price.validTo} onChange={(event) => setPrice({ ...price, validTo: event.target.value })}/></label>
          <label>{en ? "Demo label (optional)" : "Nhãn demo (không bắt buộc)"}<input className="field" maxLength={100} value={price.demoLabel} onChange={(event) => setPrice({ ...price, demoLabel: event.target.value })}/></label>
          <label style={{ gridColumn: "1 / -1" }}>{en ? "Terms and exclusions" : "Điều kiện và khoản không bao gồm"}<textarea className="field" rows={2} maxLength={1600} value={price.terms} onChange={(event) => setPrice({ ...price, terms: event.target.value })}/></label>
        </div>}
        <p className="form-hint" style={{ marginTop: 10 }}>{en ? "Verified entries are rejected by the API unless their required source evidence is provided. Saving never auto-approves." : "API từ chối trạng thái đã xác minh nếu thiếu bằng chứng nguồn bắt buộc. Lưu dữ liệu không tự động công khai."}</p>
        <button className="button button-primary" type="submit" disabled={busy === "save" || !selected} style={{ marginTop: 12 }}>{busy === "save" ? <LoaderCircle size={16} className="animate-spin"/> : <Plus size={16}/>} {en ? "Save pending record" : "Lưu bản ghi chờ duyệt"}</button>
      </form>
    </div>

    {selected && <div className="admin-list" style={{ marginTop: 16 }}>
      {selectedMedia.map((record) => <article className="panel" key={record.id}><div className="place-grid">
        {/* Admin previews accept reviewed HTTPS URLs; Next Image optimization is intentionally disabled for arbitrary hosts. */}
        <div><span className="status-label">{en ? record.alt_en : record.alt_vi}</span><a className="text-link" href={record.image_url} target="_blank" rel="noreferrer">{en ? "Open image" : "Mở ảnh"}</a></div>
        <div><span className="status-label">{record.approved ? (en ? "Public" : "Đang công khai") : (en ? "Pending" : "Chờ duyệt")}{record.is_archival ? ` · ${en ? "archival" : "tư liệu"}` : ""}</span><h3 className="panel-title">{record.credit} · {record.license}</h3><a className="text-link" href={record.source_url} target="_blank" rel="noreferrer">{en ? "Photo source" : "Nguồn ảnh"}</a><p className="form-hint">{record.checked_at} · <a href={record.license_url} target="_blank" rel="noreferrer">{en ? "License terms" : "Điều khoản giấy phép"}</a></p>{renderRecordActions("media", record)}</div></div></article>)}
      {selectedHours.map((record) => <article className="panel" key={record.id}><span className="status-label">{weekdayNames[en ? "en" : "vi"][record.weekday]} · {record.status} · {record.approved ? (en ? "Public" : "Đang công khai") : (en ? "Pending" : "Chờ duyệt")}</span><h3 className="panel-title">{record.opens_local && record.closes_local ? `${record.opens_local.slice(0, 5)}–${record.closes_local.slice(0, 5)}` : (en ? "Hours not specified" : "Chưa có giờ cụ thể")}</h3><p>{en ? record.note_en : record.note}</p>{record.source_url && <a className="text-link" href={record.source_url} target="_blank" rel="noreferrer">{record.source_label}</a>}{renderRecordActions("hours", record)}</article>)}
      {selectedPrices.map((record) => <article className="panel" key={record.id}><span className="status-label">{record.status} · {record.approved ? (en ? "Public" : "Đang công khai") : (en ? "Pending" : "Chờ duyệt")}</span><h3 className="panel-title">{record.item_label} · {record.audience}</h3><p>{record.amount_vnd === null ? (en ? "Amount unknown" : "Chưa có giá") : `${record.amount_vnd.toLocaleString(en ? "en-US" : "vi-VN")} ₫`}{record.terms ? ` · ${record.terms}` : ""}</p>{record.source_url && <a className="text-link" href={record.source_url} target="_blank" rel="noreferrer">{record.source_label}</a>}{renderRecordActions("price", record)}</article>)}
      {!selectedMedia.length && !selectedHours.length && !selectedPrices.length && <div className="empty-state">{en ? "No photo, hours or price records for this place yet." : "Địa điểm này chưa có bản ghi ảnh, giờ hoặc giá."}</div>}
    </div>}
  </section>;
}
