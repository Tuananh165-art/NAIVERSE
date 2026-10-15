import { places as sourcePlaces, type Place, type PlaceCategory } from "@/lib/catalog";
import type { TripIntent } from "@/lib/schemas";
import { priceBreakdown } from "@/lib/cost";
import { getDrivingRoute } from "@/lib/route";

export type PlanOption = {
  id: "easy" | "short-drive" | "varied";
  status: "needs_confirmation" | "infeasible";
  stops: Place[];
  route: Awaited<ReturnType<typeof getDrivingRoute>>;
  cost: ReturnType<typeof priceBreakdown>;
  warnings: string[];
};

function categoryHints(prompt: string): PlaceCategory[] {
  const value = prompt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const hints: PlaceCategory[] = [];
  if (/ho|thac|suoi|rung|forest|lake|nature/.test(value)) hints.push("nature");
  if (/lich su|van hoa|di tich|museum|heritage|culture/.test(value)) hints.push("culture");
  if (/tre|be|gia dinh|family|child|kid|play|water park/.test(value)) hints.push("family");
  if (/mon|an|food|eat|restaurant|pomelo/.test(value)) hints.push("food");
  if (/ngu|nghi|hotel|stay|resort|homestay/.test(value)) hints.push("stay");
  return hints;
}

function chooseStops(intent: TripIntent, prompt: string, seed: string, places: Place[]): Place[] {
  const categories = new Set([...intent.interests, ...categoryHints(prompt)]);
  const regions = intent.regions.map((value) => value.toLowerCase());
  const required = intent.requiredPlaceIds.map((id) => places.find((place) => place.id === id)).filter((place): place is Place => Boolean(place && place.status !== "paused_reference"));
  const candidates = places.filter((place) => !place.isGroup && place.status !== "paused_reference");

  const scored = candidates.map((place) => {
    const haystack = [place.region, place.regionEn, ...place.aliases].join(" ").toLowerCase();
    const regionMatch = regions.length > 0 && regions.some((region) => haystack.includes(region) || region.includes(haystack));
    const categoryMatch = categories.has(place.category);
    const verified = place.status === "reference" ? 1 : 0;
    const travelEase = place.latitude !== null && place.longitude !== null ? 2 : 0;
    const varietyNoise = seed === "varied" ? ((place.id.charCodeAt(0) + place.id.length * 7) % 9) / 10 : 0;
    const score = seed === "easy"
      ? (categoryMatch ? 3 : 0) + (regionMatch ? 2 : 0) + travelEase + verified
      : seed === "short-drive"
        ? (regionMatch ? 4 : 0) + travelEase + (categoryMatch ? 1 : 0) + verified
        : (categoryMatch ? 2 : 0) + (regionMatch ? 1 : 0) + verified + varietyNoise;
    return { place, score };
  }).sort((a, b) => b.score - a.score || a.place.id.localeCompare(b.place.id));

  const result = [...required];
  const categoryCounts = new Map<PlaceCategory, number>();
  for (const place of result) categoryCounts.set(place.category, (categoryCounts.get(place.category) ?? 0) + 1);
  for (const { place } of scored) {
    if (result.some((selected) => selected.id === place.id)) continue;
    const count = categoryCounts.get(place.category) ?? 0;
    const desiredCount = seed === "varied" ? 2 : 3;
    if (count >= desiredCount) continue;
    result.push(place);
    categoryCounts.set(place.category, count + 1);
    if (result.length >= Math.min(intent.durationDays * 3, 9)) break;
  }
  return result.slice(0, Math.min(intent.durationDays * 3, 9));
}

export async function buildPlans(intent: TripIntent, prompt: string, places: Place[] = sourcePlaces): Promise<PlanOption[]> {
  const variants = ["easy", "short-drive", "varied"] as const;
  return Promise.all(variants.map(async (variant) => {
    const stops = chooseStops(intent, prompt, variant, places);
    const route = ["car", "private_vehicle"].includes(intent.transport) ? await getDrivingRoute(stops) : null;
    const cost = priceBreakdown(stops);
    const warnings: string[] = [];

    if (stops.some((place) => place.latitude === null || place.longitude === null)) warnings.push("Thiếu tọa độ cổng vào; không thể xác nhận khoảng cách tuyến.");
    const unavailableRequired = intent.requiredPlaceIds.filter((id) => !stops.some((place) => place.id === id));
    if (unavailableRequired.length) warnings.push(`Không thể đáp ứng địa điểm bắt buộc: ${unavailableRequired.join(", ")}. Hãy chọn một yêu cầu khác hoặc xác minh tình trạng địa điểm.`);
    if (stops.some((place) => place.status !== "reference")) warnings.push("Có điểm chưa xác minh tình trạng tiếp khách hoặc giờ mở cửa.");
    if (cost.unknownCount > 0) warnings.push(`Chưa có giá được xác nhận cho ${cost.unknownCount} điểm dừng; không thể kết luận tổng chi phí nằm trong ngân sách.`);
    if (!process.env.OPENROUTESERVICE_API_KEY && ["car", "private_vehicle"].includes(intent.transport)) warnings.push("Chưa cấu hình dịch vụ định tuyến; thứ tự điểm chỉ là gợi ý, chưa có thời gian/quãng đường lái xe.");
    if (!["car", "private_vehicle"].includes(intent.transport)) warnings.push("Chưa có định tuyến phù hợp với phương tiện đã chọn; không suy diễn thời gian/quãng đường lái xe.");
    if (intent.rainyDay) warnings.push("Khách yêu cầu phương án khi mưa; cần xác nhận trạng thái mở của lựa chọn trong nhà trước khi đi.");
    if (intent.lowMobility) warnings.push("Thông tin tiếp cận của các điểm chưa được khảo sát đầy đủ; hãy gọi đơn vị quản lý để xác nhận.");
    if (intent.budgetVnd !== null) warnings.push(`Ngân sách đã nhập: ${intent.budgetVnd.toLocaleString("vi-VN")} ₫. Tổng phí thực tế chưa thể tính khi giá chưa được xác nhận.`);

    return { id: variant, status: unavailableRequired.length ? "infeasible" : "needs_confirmation", stops, route, cost, warnings };
  }));
}
