import type { z } from "zod";
import { packingInputSchema, packingOutputSchema } from "@/lib/schemas";

export type PackingInput = z.infer<typeof packingInputSchema>;
export type PackingOutput = z.infer<typeof packingOutputSchema>;
export type PackingItemCode = PackingOutput["items"][number]["code"];
export type PackingReasonCode = PackingOutput["items"][number]["reason"];

type Copy = { label: { vi: string; en: string }; detail: { vi: string; en: string }; category: { vi: string; en: string } };

export const packingCatalog: Record<PackingItemCode, Copy> = {
  sun_protection: { label: { vi: "Nón và chống nắng cá nhân", en: "Hat and personal sun protection" }, detail: { vi: "Dùng khi ở ngoài trời; không thay thế thông tin thời tiết tại điểm đến.", en: "For outdoor time; this is not a destination weather report." }, category: { vi: "Thời tiết", en: "Weather" } },
  water_bottle: { label: { vi: "Bình nước cá nhân", en: "Personal water bottle" }, detail: { vi: "Tự kiểm tra quy định mang đồ uống của nơi bạn đến.", en: "Check each venue's rules for bringing drinks." }, category: { vi: "Đồ dùng cơ bản", en: "Essentials" } },
  comfortable_shoes: { label: { vi: "Giày dép phù hợp", en: "Suitable footwear" }, detail: { vi: "Chọn theo hoạt động và khả năng di chuyển của nhóm.", en: "Choose based on planned activities and your group's needs." }, category: { vi: "Di chuyển", en: "Getting around" } },
  rain_layer: { label: { vi: "Áo mưa gọn nhẹ", en: "Light rain layer" }, detail: { vi: "Gợi ý dự phòng theo lựa chọn phương án mưa, không phải dự báo.", en: "A precaution for a rain-plan request, not a forecast." }, category: { vi: "Thời tiết", en: "Weather" } },
  waterproof_bag: { label: { vi: "Túi chống nước cho đồ cá nhân", en: "Water-resistant bag for personal items" }, detail: { vi: "Giữ thiết bị và giấy tờ khô khi cần; không bảo đảm chống nước tuyệt đối.", en: "Helps keep devices and documents dry; not a waterproof guarantee." }, category: { vi: "Đồ dùng cơ bản", en: "Essentials" } },
  insect_repellent: { label: { vi: "Thuốc/xịt chống côn trùng phù hợp cá nhân", en: "Personal insect repellent, if suitable" }, detail: { vi: "Đọc nhãn và hướng dẫn sử dụng; hỏi chuyên gia nếu chưa rõ phù hợp.", en: "Follow the product label; ask a professional if suitability is unclear." }, category: { vi: "Ngoài trời", en: "Outdoor" } },
  personal_medication: { label: { vi: "Thuốc cá nhân đang sử dụng", en: "Personal medication you already use" }, detail: { vi: "Giữ nguyên toa và hướng dẫn của nhân viên y tế; NaiVerse không tư vấn liều dùng.", en: "Follow your clinician's instructions; NaiVerse does not advise on dosage." }, category: { vi: "Sức khỏe cá nhân", en: "Personal health" } },
  small_first_aid: { label: { vi: "Bộ sơ cứu cá nhân cơ bản", en: "Personal basic first-aid kit" }, detail: { vi: "Không thay thế dịch vụ y tế hoặc sơ cứu chuyên môn.", en: "Does not replace professional first aid or medical care." }, category: { vi: "Sức khỏe cá nhân", en: "Personal health" } },
  power_bank: { label: { vi: "Pin sạc dự phòng", en: "Power bank" }, detail: { vi: "Kiểm tra quy định vận chuyển nếu đi máy bay hoặc phương tiện có giới hạn.", en: "Check carriage rules for flights or transport with restrictions." }, category: { vi: "Đồ dùng cơ bản", en: "Essentials" } },
  change_clothes: { label: { vi: "Quần áo thay theo số ngày", en: "A change of clothes for the trip length" }, detail: { vi: "Điều chỉnh theo hoạt động và điều kiện lưu trú đã xác nhận.", en: "Adjust for activities and confirmed accommodation." }, category: { vi: "Lưu trú", en: "Overnight" } },
  child_snacks: { label: { vi: "Đồ ăn nhẹ quen thuộc cho trẻ", en: "Familiar snacks for the child" }, detail: { vi: "Kiểm tra dị ứng và quy định mang thức ăn của nơi đến.", en: "Check allergies and each venue's outside-food rules." }, category: { vi: "Gia đình", en: "Family" } },
  child_spare_clothes: { label: { vi: "Quần áo dự phòng cho trẻ", en: "Spare clothes for the child" }, detail: { vi: "Số lượng tùy thời lượng và hoạt động gia đình đã chọn.", en: "Choose an amount for the trip length and family activities." }, category: { vi: "Gia đình", en: "Family" } },
  personal_mobility_aid: { label: { vi: "Dụng cụ hỗ trợ di chuyển cá nhân thường dùng", en: "Personal mobility aid you usually use" }, detail: { vi: "Việc mang dụng cụ không xác nhận địa điểm có lối tiếp cận phù hợp.", en: "Bringing an aid does not confirm venue accessibility." }, category: { vi: "Di chuyển", en: "Getting around" } },
  reusable_bag: { label: { vi: "Túi dùng nhiều lần", en: "Reusable bag" }, detail: { vi: "Dùng cho đồ cá nhân hoặc rác mang ra khỏi khu tự nhiên.", en: "For personal items or carrying out waste from natural areas." }, category: { vi: "Du lịch có trách nhiệm", en: "Responsible travel" } },
  personal_id: { label: { vi: "Giấy tờ tùy thân cần thiết", en: "Necessary identification" }, detail: { vi: "Tự kiểm tra yêu cầu của nhà cung cấp dịch vụ đã xác nhận.", en: "Check requirements from confirmed service providers." }, category: { vi: "Đồ dùng cơ bản", en: "Essentials" } },
};

const itemReasons: Record<PackingItemCode, PackingReasonCode[]> = {
  sun_protection: ["outdoor_activity", "child_specific"],
  water_bottle: ["general_preparedness", "outdoor_activity"],
  comfortable_shoes: ["outdoor_activity"],
  rain_layer: ["rain_plan"],
  waterproof_bag: ["rain_plan"],
  insect_repellent: ["outdoor_activity"],
  personal_medication: ["personal_health"],
  small_first_aid: ["personal_health", "general_preparedness"],
  power_bank: ["multi_day", "general_preparedness"],
  change_clothes: ["multi_day", "child_specific"],
  child_snacks: ["child_specific"],
  child_spare_clothes: ["child_specific"],
  personal_mobility_aid: ["limited_mobility"],
  reusable_bag: ["general_preparedness", "outdoor_activity"],
  personal_id: ["general_preparedness", "group_organization"],
};

export function allowedPackingReasons(input: PackingInput, placeCategories: string[]): PackingReasonCode[] {
  const reasons: PackingReasonCode[] = ["general_preparedness", "personal_health"];
  if (input.durationDays > 1) reasons.push("multi_day");
  if (input.childHeightCm !== null) reasons.push("child_specific");
  if (input.rainyDay) reasons.push("rain_plan");
  if (input.lowMobility) reasons.push("limited_mobility");
  if (input.partySize >= 3) reasons.push("group_organization");
  if (input.interests.some((interest) => interest === "nature" || interest === "experience") || placeCategories.some((category) => category === "nature" || category === "experience")) reasons.push("outdoor_activity");
  return reasons;
}

export function allowedPackingItems(reasons: PackingReasonCode[]): PackingItemCode[] {
  return (Object.keys(itemReasons) as PackingItemCode[]).filter((code) => itemReasons[code].some((reason) => reasons.includes(reason)));
}

export function allowedReasonsForPackingItem(code: PackingItemCode, allowedReasons: PackingReasonCode[]): PackingReasonCode[] {
  return itemReasons[code].filter((reason) => allowedReasons.includes(reason));
}

export function validPackingItemReason(code: PackingItemCode, reason: PackingReasonCode, allowedReasons: PackingReasonCode[]) {
  return allowedReasons.includes(reason) && itemReasons[code].includes(reason);
}

export const packingReasonCopy: Record<PackingReasonCode, { vi: string; en: string }> = {
  general_preparedness: { vi: "Đồ dùng chuẩn bị chung cho chuyến đi.", en: "General trip preparation." },
  multi_day: { vi: "Lịch trình kéo dài nhiều ngày.", en: "The itinerary spans multiple days." },
  child_specific: { vi: "Bạn cho biết nhóm có trẻ em.", en: "You indicated a child is traveling." },
  outdoor_activity: { vi: "Có hoạt động hoặc điểm đến ngoài trời trong lựa chọn.", en: "The selected interests or stops include outdoor activities." },
  rain_plan: { vi: "Bạn chọn cần chuẩn bị phương án mưa; đây không phải dự báo.", en: "You requested rain preparation; this is not a forecast." },
  personal_health: { vi: "Chỉ áp dụng cho nhu cầu cá nhân đã được chuyên gia hướng dẫn.", en: "Only for personal needs already guided by a professional." },
  limited_mobility: { vi: "Bạn cho biết nhóm cần lưu ý khả năng di chuyển.", en: "You indicated mobility needs in the group." },
  group_organization: { vi: "Nhóm có nhiều người; tự thống nhất giấy tờ/vật dụng chung.", en: "For a larger group; coordinate shared documents and essentials." },
};

export const packingPriorityCopy = {
  1: { vi: "Ưu tiên", en: "Top priority" },
  2: { vi: "Nên mang", en: "Recommended" },
  3: { vi: "Tùy chọn", en: "Optional" },
} as const;
