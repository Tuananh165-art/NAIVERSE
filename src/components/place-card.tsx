import { Link } from "@/i18n/routing";
import Image from "next/image";
import { ArrowUpRight, Compass, Heart, Leaf, Utensils, Users, Building2, Sparkles, CircleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Place } from "@/lib/catalog";
import { PlaceIllustration } from "@/components/place-illustration";

const icons = { nature: Leaf, culture: Building2, family: Users, food: Utensils, stay: Heart, experience: Sparkles };

export function PlaceCard({ place }: { place: Place }) {
  const locale = useLocale();
  const t = useTranslations("catalog");
  const Icon = icons[place.category] ?? Compass;
  const english = locale === "en";
  const photo = place.photos[0];
  const illustration = !photo && <PlaceIllustration placeId={place.id} placeName={english ? place.nameEn : place.name} locale={locale} compact/>;
  return (
    <article className="place-card">
      <div className={`place-cover ${place.category}${photo ? " has-photo" : illustration ? " has-illustration" : ""}`}>
        {photo ? <Image src={photo.url} alt={english ? photo.altEn : photo.altVi} width={1200} height={720} sizes="(max-width: 570px) 120px, (max-width: 820px) 50vw, 33vw" unoptimized loading="lazy" /> : illustration || <Icon aria-hidden="true" />}
        <span className="place-cover-label">{place.isGroup ? t("group") : t(place.category)}</span>
        {!photo && illustration && <span className="place-illustration-badge">{english ? "Illustration" : "Minh họa"}</span>}
        {photo && <span className="place-photo-credit">{english ? "Photo" : "Ảnh"}: {photo.credit} · {photo.license}{photo.sourceUrl && <> · <a href={photo.sourceUrl} target="_blank" rel="noreferrer">{english ? "Source" : "Nguồn"}</a></>}</span>}
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
