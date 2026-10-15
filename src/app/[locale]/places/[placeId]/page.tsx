import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Flag, MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getPlaceCatalog, getPlaceHours, getPlacePriceReferences } from "@/lib/catalog-server";
import { PlaceReportForm } from "@/components/place-report-form";
import { PlaceIllustration } from "@/components/place-illustration";

const weekdays = {
  vi: ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};
const weekdayLabel = (weekday: number, locale: "vi" | "en") => weekday === -1
  ? (locale === "en" ? "General hours (day not specified)" : "Giờ chung (nguồn không nêu ngày cụ thể)")
  : weekdays[locale][weekday];
const priceStatusLabel = (status: string, en: boolean) => ({
  verified: en ? "Verified" : "Đã xác minh",
  historical: en ? "Historical" : "Lịch sử",
  conflicting: en ? "Conflicting sources" : "Nguồn mâu thuẫn",
  unknown: en ? "Unconfirmed" : "Chưa xác minh",
}[status] ?? status);

export default async function PlacePage({ params }: { params: Promise<{ locale: string; placeId: string }> }) {
  const { locale, placeId } = await params;
  const en = locale === "en";
  const place = (await getPlaceCatalog()).find((item) => item.id === placeId);
  if (!place) notFound();
  const [prices, hours] = await Promise.all([getPlacePriceReferences(place.id), getPlaceHours(place.id)]);
  const today = new Date().toISOString().slice(0, 10);
  const cutoffDate = new Date(today + "T00:00:00Z");
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 30);
  const priceFreshnessCutoff = cutoffDate.toISOString().slice(0, 10);
  const isFresh = (checkedAt: string | null) => Boolean(checkedAt && checkedAt >= priceFreshnessCutoff);
  const activePrices = prices.filter((price) => price.status === "verified" && (!price.valid_to || price.valid_to >= today) && isFresh(price.checked_at));
  const activeHours = hours.filter((entry) => entry.status === "verified" && (!entry.valid_from || entry.valid_from <= today) && (!entry.valid_to || entry.valid_to >= today));
  const reportedHours = hours.filter((entry) => entry.status !== "verified");

  return <div className="container section">
    <Link href="/places" className="text-link"><ArrowLeft size={15}/>{en ? "All destinations" : "Tất cả địa điểm"}</Link>
    <p className="eyebrow" style={{ marginTop: 20 }}><MapPin size={15}/>{en ? place.regionEn : place.region}</p>
    <h1 className="page-title">{en ? place.nameEn : place.name}</h1>
    <p className="section-description">{en ? place.descriptionEn : place.description}</p>
    {prices.some((price) => price.status === "conflicting") && <div className="alert" role="note" style={{ marginTop: 16 }}>
      {en ? "Some published prices conflict across sources. NaiVerse excludes them from current-price summaries and itinerary totals; confirm the amount with the operator before purchase." : "Một số giá được công bố đang mâu thuẫn giữa các nguồn. NaiVerse không tính chúng vào giá hiện hành hoặc tổng lịch trình; hãy xác nhận mức giá với đơn vị vận hành trước khi mua."}
    </div>}
    {place.photos.length > 0 && <section className="photo-gallery" aria-label={en ? "Destination photos" : "Ảnh địa điểm"}>
      {place.photos.map((photo) => <figure className="licensed-photo" key={photo.sourceUrl ?? photo.url}>
        <Image src={photo.url} alt={en ? photo.altEn : photo.altVi} width={1100} height={720} unoptimized/>
        <figcaption>{photo.archival && <strong>{en ? "Archive photo · " : "Ảnh tư liệu · "}</strong>}{photo.credit} · {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a> : photo.license}{photo.sourceUrl && <> · <a href={photo.sourceUrl} target="_blank" rel="noreferrer">{en ? "Original photo" : "Nguồn ảnh"}</a></>} · {en ? "Checked" : "Đối chiếu"} {photo.checkedAt}.</figcaption>
      </figure>)}
    </section>}
    {place.photos.length === 0 && <figure className="place-illustration-gallery">
      <PlaceIllustration placeId={place.id} placeName={en ? place.nameEn : place.name} locale={locale}/>
      <figcaption>{en ? "NaiVerse concept illustration, not a photograph of this destination. It does not verify the site's appearance, access or current condition." : "Minh họa ý tưởng của NaiVerse, không phải ảnh chụp địa điểm. Hình không xác minh diện mạo, lối vào hay hiện trạng hiện nay."}</figcaption>
    </figure>}
    <section className="panel" style={{ marginTop: 22 }}>
      <span className="status-label">{place.status === "paused_reference" ? (en ? "Paused reference" : "Tạm dừng tham khảo") : place.status === "reference" ? (en ? "Reference" : "Thông tin tham khảo") : (en ? "Needs confirmation" : "Cần xác minh")}</span>
      <h2 className="panel-title">{en ? "Information status" : "Trạng thái thông tin"}</h2>
      <p>{en ? place.statusNoteEn : place.statusNote}</p>
      <div className="metric-row">
        <div className="metric"><span className="metric-label">{en ? "Mapped coordinates" : "Tọa độ bản đồ"}</span><strong className="metric-value">{place.latitude === null ? (en ? "Not verified" : "Chưa đối chiếu") : String(place.latitude) + ", " + String(place.longitude)}</strong><span className="form-hint">{place.coordinatePrecision === "entrance_verified" ? (en ? "Verified entrance" : "Cổng vào đã xác minh") : place.coordinatePrecision === "venue_feature" ? (en ? "Mapped feature; not a verified entrance" : "Đối tượng bản đồ; chưa xác minh là cổng") : place.coordinatePrecision === "approximate" ? (en ? "Approximate point" : "Vị trí gần đúng") : ""}</span>{place.coordinateEvidence?.url && <a className="text-link" href={place.coordinateEvidence.url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>{en ? "Coordinate source" : "Nguồn tọa độ"} · {place.coordinateEvidence.checkedAt}</a>}</div>
        <div className="metric"><span className="metric-label">{en ? "Current sourced prices" : "Giá có nguồn đang hiệu lực"}</span><strong className="metric-value">{activePrices.length ? (en ? String(activePrices.length) + " sourced item(s)" : String(activePrices.length) + " mục có nguồn") : (en ? "Unknown" : "Chưa có nguồn xác nhận")}</strong></div>
        <div className="metric"><span className="metric-label">{en ? "Opening hours" : "Giờ hoạt động"}</span><strong className="metric-value">{activeHours.length ? (en ? "See verified hours below" : "Xem giờ đã xác minh bên dưới") : reportedHours.length ? (en ? "Source reports a schedule; unverified" : "Nguồn có nêu lịch; chưa xác minh") : (en ? "Not verified" : "Chưa có nguồn xác nhận")}</strong></div>
      </div>
      {place.photos.length === 0 && <p className="form-hint">{en ? "No appropriately licensed destination photo has been reviewed yet." : "Chưa có ảnh địa điểm được rà soát giấy phép phù hợp."}</p>}
      {activePrices.length > 0 && <><h3 className="panel-title" style={{ marginTop: 20 }}>{en ? "Verified price references" : "Giá đã đối chiếu nguồn"}</h3>{activePrices.map((price) => <div className="itinerary-stop" key={price.id}><span className="itinerary-marker"/><span><strong>{price.item_label} · {price.audience}</strong><p>{price.amount_vnd === null ? (en ? "Amount unknown" : "Chưa biết số tiền") : price.amount_vnd.toLocaleString(en ? "en-US" : "vi-VN") + " ₫"} · {price.source_label} · {price.checked_at}</p><p>{price.terms}</p>{price.source_url && <a className="text-link" href={price.source_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>{en ? "Open price source" : "Mở nguồn giá"}</a>}</span></div>)}</>}
      {prices.some((price) => price.status !== "verified" || (price.valid_to !== null && price.valid_to < today) || !isFresh(price.checked_at)) && <><h3 className="panel-title" style={{ marginTop: 20 }}>{en ? "Historical, stale or unconfirmed price notes" : "Giá lịch sử, đã cũ hoặc chưa xác nhận"}</h3>{prices.filter((price) => price.status !== "verified" || (price.valid_to !== null && price.valid_to < today) || !isFresh(price.checked_at)).map((price) => <div className="itinerary-stop" key={price.id}><span className="itinerary-marker"/><span><strong>{price.item_label} · {priceStatusLabel(price.status, en)}</strong><p>{price.amount_vnd === null ? (en ? "Amount unknown" : "Chưa biết số tiền") : price.amount_vnd.toLocaleString(en ? "en-US" : "vi-VN") + " ₫"} · {price.source_label} · {price.checked_at ?? (en ? "date unknown" : "chưa có ngày kiểm tra")}</p><p>{price.terms}</p>{price.source_url && <a className="text-link" href={price.source_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>{en ? "Open source" : "Mở nguồn"}</a>}</span></div>)}</>}
      {activeHours.length > 0 && <><h3 className="panel-title" style={{ marginTop: 20 }}>{en ? "Published opening hours" : "Giờ hoạt động có nguồn"}</h3>{activeHours.map((entry) => <div className="itinerary-stop" key={entry.id}><span className="itinerary-marker"/><span><strong>{weekdayLabel(entry.weekday, en ? "en" : "vi")}:</strong> {entry.opens_local?.slice(0, 5)}–{entry.closes_local?.slice(0, 5)} · {entry.source_label} · {entry.checked_at}<p>{en ? entry.note_en : entry.note}</p>{entry.source_url && <a className="text-link" href={entry.source_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>{en ? "Source" : "Nguồn"}</a>}</span></div>)}</>}
      {reportedHours.length > 0 && <><h3 className="panel-title" style={{ marginTop: 20 }}>{en ? "Schedule reported by the source (unverified)" : "Lịch nguồn công bố (chưa xác minh)"}</h3>{reportedHours.map((entry) => <div className="itinerary-stop" key={entry.id}><span className="itinerary-marker"/><span><strong>{weekdayLabel(entry.weekday, en ? "en" : "vi")}:</strong> {entry.opens_local && entry.closes_local ? `${entry.opens_local.slice(0, 5)}–${entry.closes_local.slice(0, 5)}` : (en ? "Reported closed; holiday exceptions may apply" : "Nguồn ghi nghỉ; có thể có ngoại lệ ngày lễ")}<p>{en ? entry.note_en : entry.note}</p><p>{entry.source_label} · {entry.checked_at} {entry.source_url && <a className="text-link" href={entry.source_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>{en ? "Open schedule source" : "Mở nguồn giờ"}</a>}</p></span></div>)}</>}
      {!activeHours.length && !reportedHours.length && <p className="form-hint">{en ? "Opening hours have not been confirmed from a source. Contact the operator before travelling." : "Chưa xác nhận giờ hoạt động từ nguồn. Hãy liên hệ cơ sở trước khi đi."}</p>}
      <h3 className="panel-title" style={{ marginTop: 20 }}>{en ? "Evidence to review" : "Nguồn tham khảo"}</h3>
      {place.evidence.map((evidence) => <p key={evidence.label}>{en ? evidence.labelEn ?? evidence.label : evidence.label}{evidence.checkedAt && <span className="form-hint"> · {en ? "checked" : "đối chiếu"} {evidence.checkedAt}</span>} {evidence.url && <a className="text-link" href={evidence.url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>{en ? "Open source" : "Mở nguồn"}</a>}</p>)}
      <p className="form-hint">{en ? "The check date applies only to the facts stated by each source. No unverified entrance coordinate, opening hours, price, photo or partner is presented as confirmed." : "Ngày kiểm tra chỉ áp dụng cho thông tin nguồn nêu. Không trình bày tọa độ cổng, giờ, giá, ảnh hoặc đối tác chưa xác minh như dữ liệu chắc chắn."}</p>
    </section>
    <PlaceReportForm placeId={place.id}/>
    <Link className="button button-quiet" href="/responsible" style={{ marginTop: 16 }}><Flag size={15}/>{en ? "Responsible travel notes" : "Lưu ý du lịch có trách nhiệm"}</Link>
  </div>;
}
