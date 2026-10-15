import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

export function SiteFooter() {
  const t = useTranslations("common");
  const nav = useTranslations("footer");
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div>
          <Link href="/" className="brand"><span className="brand-mark"><MapPin size={20} /></span><span>Nai<em>Verse</em></span></Link>
          <p className="footer-brand-copy">{nav("tagline")}</p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link href="/places">{nav("discover")}</Link><Link href="/journey">{nav("journey")}</Link><Link href="/partner">{nav("business")}</Link><Link href="/admin">{nav("admin")}</Link><Link href="/responsible">{nav("responsible")}</Link>
          <a href="https://dongnai.gov.vn" target="_blank" rel="noreferrer">{nav("government")}</a>
        </nav>
      </div>
      <div className="container footer-legal">{t("footer")} {nav("credits")} {t("noPartner")}</div>
    </footer>
  );
}
