export type Locale = "vi" | "en";

const immediateDangerPattern = /\b(unconscious|not breathing|can't breathe|cannot breathe|severe injury|serious accident|fire|assault|life[- ]threatening|emergency now)\b|ngất|bất tỉnh|khó thở|không thở|chảy máu nhiều|tai nạn nghiêm trọng|cháy|bị tấn công|đe dọa tính mạng|cấp cứu ngay/i;

export function isImmediateDanger(text: string): boolean {
  return immediateDangerPattern.test(text);
}

export function getEmergencyGuidance(locale: Locale) {
  return {
    message: locale === "en"
      ? "This may be an emergency. Do not wait for an AI response. Call the appropriate local service now: Police 113, Fire and Rescue 114, or Medical emergency 115. If you are at a venue, alert its staff as well."
      : "Đây có thể là tình huống khẩn cấp. Đừng chờ chatbot trả lời. Hãy gọi ngay dịch vụ phù hợp: Công an 113, Cứu hỏa và Cứu nạn 114, hoặc Cấp cứu y tế 115. Nếu đang ở cơ sở du lịch, hãy báo nhân viên tại chỗ.",
    hotlines: [
      { number: "113", label: locale === "en" ? "Police" : "Công an" },
      { number: "114", label: locale === "en" ? "Fire and rescue" : "Cứu hỏa, cứu nạn" },
      { number: "115", label: locale === "en" ? "Medical emergency" : "Cấp cứu y tế" },
    ],
  };
}
