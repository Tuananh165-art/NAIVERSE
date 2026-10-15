import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowDown, Info } from "lucide-react";
import { PlaceFilters } from "@/components/place-filters";
import { ExploreMapLoader } from "@/components/explore-map-loader";
import { getPlaceCatalog } from "@/lib/catalog-server";

export const metadata: Metadata = { title: "Khám phá Đồng Nai" };

export default async function PlacesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("catalog");
  const en = locale === "en";
  const places = await getPlaceCatalog();
  return (
    <div className="container section">
      <p className="eyebrow"><ArrowDown size={14} />{en ? "START EXPLORING" : "BẮT ĐẦU KHÁM PHÁ"}</p>
      <h1 className="page-title">{t("title")}</h1><p className="section-description">{t("subtitle")}</p>
      <div className="alert alert-blue" style={{ marginTop: 20 }}><Info size={18} /><span>{en ? "These initial catalog records need operational, entrance-coordinate and price checks. Missing facts are intentionally left blank." : "Danh mục ban đầu còn cần xác minh giờ hoạt động, tọa độ cổng vào và giá. Thông tin chưa có căn cứ được để trống."}</span></div>
      <section id="map" className="section-sm"><h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: 13 }}>{en ? "Map" : "Bản đồ"}</h2><ExploreMapLoader places={places} /></section>
      <PlaceFilters places={places} />
    </div>
  );
}
