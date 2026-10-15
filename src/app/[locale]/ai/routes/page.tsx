import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { AiRouteAssist } from "@/components/ai-route-assist";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function AiRoutesPage() {
  const [locale, user] = await Promise.all([getLocale(), getCurrentUser()]);
  const en = locale === "en";
  return <>
    <AiRouteAssist signedIn={Boolean(user)}/>
    <div className="container section-sm"><Link className="text-link" href="/ai/conditions">{en ? "Weather and safety assistant" : "Trợ lý thời tiết và an toàn"}</Link></div>
  </>;
}
