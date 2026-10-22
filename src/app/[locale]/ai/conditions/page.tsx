import { CloudSun, Leaf, ShieldAlert } from "lucide-react";
import { AiConditionsForm } from "@/components/ai-conditions-form";
import { getCurrentUser } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function AiConditionsPage() {
  const [locale, user] = await Promise.all([getLocale(), getCurrentUser()]);
  const en = locale === "en";
  return <div className="container section">
    <p className="eyebrow"><CloudSun size={15}/>{en ? "WEATHER · SAFETY · RESPONSIBLE TRAVEL" : "THỜI TIẾT · AN TOÀN · DU LỊCH CÓ TRÁCH NHIỆM"}</p>
    <h1 className="page-title">{en ? "Prepare for a safer trip" : "Chuẩn bị chuyến đi an toàn hơn"}</h1>
    <p className="section-description">{en ? "A regional Open-Meteo forecast with AI suggestions, practical green travel ideas, and direct human escalation for urgent situations." : "Dự báo Open-Meteo theo vùng kèm gợi ý AI, ý tưởng du lịch xanh thực tế và chuyển thẳng sang người thật khi khẩn cấp."}</p>
    <div className="button-row" style={{ marginTop: 16 }}><Link className="button button-secondary" href="/ai/routes"><Leaf size={16}/>{en ? "AI route assistant" : "AI giao thông và hành trình"}</Link><Link className="button button-quiet" href="/responsible"><ShieldAlert size={16}/>{en ? "Responsible travel notes" : "Lưu ý du lịch có trách nhiệm"}</Link></div>
    <AiConditionsForm signedIn={Boolean(user)}/>
  </div>;
}
