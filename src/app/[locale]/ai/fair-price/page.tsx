import { BadgeCheck, CircleDollarSign, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/supabase/server";
import { getPlaceCatalog } from "@/lib/catalog-server";
import { FairPriceLens } from "@/components/fair-price-lens";

export default async function FairPricePage({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, user, catalog] = await Promise.all([params, getCurrentUser(), getPlaceCatalog()]);
  const en = locale === "en";
  const places = catalog.filter((place) => !place.isGroup && place.status !== "paused_reference");
  return <div className="container section">
    <p className="eyebrow"><CircleDollarSign size={15}/>{en ? "QUOTE REVIEW · SOURCED REFERENCES" : "RÀ SOÁT BÁO GIÁ · THAM KHẢO CÓ NGUỒN"}</p>
    <h1 className="page-title">{en ? "Understand the quote before you decide" : "Hiểu rõ báo giá trước khi quyết định"}</h1>
    <p className="section-description">{en ? "AI extracts amounts, units and missing conditions from pasted text. NaiVerse shows catalog references when available; you verify whether the items really match." : "AI trích khoản giá, đơn vị và điều kiện còn thiếu từ văn bản bạn dán. NaiVerse hiển thị giá tham khảo trong catalog nếu có; bạn tự xác nhận hai khoản có thực sự tương đương."}</p>
    <div className="button-row" style={{ marginTop: 16 }}>
      <Link className="button button-quiet" href="/ai/guide"><BadgeCheck size={16}/>{en ? "Ask the sourced AI guide" : "Tra cứu trợ lý AI có nguồn"}</Link>
      <Link className="button button-quiet" href="/responsible"><ShieldCheck size={16}/>{en ? "Responsible travel notes" : "Du lịch có trách nhiệm"}</Link>
    </div>
    <FairPriceLens signedIn={Boolean(user)} places={places.map(({ id, name, nameEn }) => ({ id, name, nameEn }))}/>
  </div>;
}
