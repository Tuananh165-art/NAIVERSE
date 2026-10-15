import { Link } from "@/i18n/routing";
import Image from "next/image";
import { ArrowUpRight, Compass, Heart, Leaf, Utensils, Users, Building2, Sparkles, CircleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Place } from "@/lib/catalog";

const icons = { nature: Leaf, culture: Building2, family: Users, food: Utensils, stay: Heart, experience: Sparkles };

export function PlaceCard({ place }: { place: Place }) {
  const locale = useLocale();
  const t = useTranslations("catalog");
  const Icon = icons[place.category] ?? Compass;
  const english = locale === "en";
  const photo = place.photos[0];
  return (
    <article className="place-card">
      <div className={`place-cover ${place.category}${photo ? " has-photo" : ""}`}>
        {photo ? <Image src={photo.url} alt={english ? photo.altEn : photo.altVi} width={1200} height={720} sizes="(max-width: 570px) 120px, (max-width: 820px) 50vw, 33vw" unoptimized loading="lazy" /> : <Icon aria-hidden="true" />}
        <span className="place-cover-label">{place.isGroup ? t("group") : t(place.category)}</span>
        {photo && <a className="place-photo-credit" href={photo.sourceUrl} target="_blank" rel="noreferrer">{english ? "Photo" : "Ảnh"}: {photo.credit} · {photo.license}</a>}
      </div>
      <div className="place-body">
        <p className="place-region">{english ? place.regionEn : place.region}</p>
        <h2 className="place-title">{english ? place.nameEn : place.name}</h2>
        <p className="place-description">{english ? place.descriptionEn : place.description}</p>
        <div className="place-foot">
          <span className="status-label"><CircleAlert size={13} />{place.status === "paused_reference" ? (english ? "Reference only" : "Chỉ tham khảo") : t("status")}</span>
          <Link className="text-link" href={`/places/${place.id}`}>{english ? "Details" : "Chi tiết"}<ArrowUpRight size={14} /></Link>
        </div>
      </div>
    </article>
  );
}
