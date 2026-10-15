import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { MapPin, Sparkles } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getCurrentUser } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";

export async function SiteHeader() {
  const t = await getTranslations("navigation");
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const en = locale === "en";
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="brand" aria-label="NaiVerse home">
          <span className="brand-mark" aria-hidden="true"><MapPin size={21} strokeWidth={2.6} /></span>
          <span>Nai<em>Verse</em></span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/places">{t("discover")}</Link>
          <Link href="/places#map">{t("map")}</Link>
          <Link className="optional" href="/journey">{t("journeys")}</Link>
          <Link className="optional" href="/ai/conditions">{en ? "Weather & safety" : "Thời tiết & an toàn"}</Link>
          <Link className="optional" href="/ai/routes">{en ? "AI routes" : "AI giao thông"}</Link>
          <Link className="optional" href="/partner">{t("business")}</Link>
        </nav>
        <div className="nav-actions">
          <LocaleSwitcher />
          {user
            ? <Link className="button button-primary" href="/trips"><Sparkles size={16} />{t("journeys")}</Link>
            : <Link className="button button-primary" href="/auth">{t("signIn")}</Link>}
        </div>
      </div>
    </header>
  );
}
