import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { ArrowRight, BadgeCheck, CircleDollarSign, CloudSun, Compass, Heart, Leaf, Route, ShieldCheck, Sparkles, Trees, Utensils } from "lucide-react";
import { HomeSearch } from "@/components/home-search";
import { getPlaceCatalog } from "@/lib/catalog-server";
import { PlaceCard } from "@/components/place-card";

const experiences = [
  { key: "nature", icon: Trees, vi: "Rừng & mặt hồ", en: "Forests & lakes", filter: "Thiên nhiên và không gian xanh.", filterEn: "Nature and green spaces." },
  { key: "culture", icon: Compass, vi: "Di sản & lịch sử", en: "Heritage & history", filter: "Khám phá câu chuyện địa phương.", filterEn: "Discover local heritage." },
  { key: "family", icon: Heart, vi: "Ngày vui gia đình", en: "Family days out", filter: "Đi cùng trẻ, chủ động kiểm tra điều kiện.", filterEn: "Travel with children and check visitor requirements." },
  { key: "food", icon: Utensils, vi: "Vị ngon địa phương", en: "Local food", filter: "Bưởi, trái cây và món ngon theo vùng.", filterEn: "Pomelo, orchard produce and regional dishes." },
];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const english = locale === "en";
  const featured = (await getPlaceCatalog()).slice(0, 6);
  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <p className="eyebrow"><Sparkles size={15} />{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p className="hero-copy">{t("subtitle")}</p>
          <p className="form-label" style={{ marginTop: 0 }}>{t("searchLabel")}</p>
          <HomeSearch />
          <div className="button-row hero-shortcuts" aria-label={english ? "AI travel assistants" : "Trợ lý AI du lịch"}>
            <Link href="/journey" className="button button-secondary"><Sparkles size={16} />{english ? "AI trip planner" : "AI lập kế hoạch chuyến đi"}</Link>
            <Link href="/ai/conditions" className="button button-secondary"><CloudSun size={16} />{english ? "Weather, safety & green travel" : "AI thời tiết, an toàn & du lịch xanh"}</Link>
            <Link href="/ai/routes" className="button button-secondary"><Route size={16} />{english ? "AI traffic & routes" : "AI giao thông & hành trình"}</Link>
          </div>
          <div className="trust-row">
            <span><ShieldCheck size={15} />{english ? "Clear information status" : "Rõ trạng thái thông tin"}</span>
            <span><CircleDollarSign size={15} />{english ? "Unknown prices stay unknown" : "Giá chưa xác minh được ghi rõ"}</span>
            <span><BadgeCheck size={15} />{english ? "No booking is claimed as confirmed" : "Không gắn nhãn đã đặt khi chưa xác nhận"}</span>
          </div>
          <div style={{ marginTop: 22 }}><Link href="/places" className="text-link">{t("allPlaces")}<ArrowRight size={15} /></Link></div>
        </div>
      </section>

      <section className="section-sm container" aria-labelledby="ai-assistants-title">
        <div className="section-heading"><p className="eyebrow"><Sparkles size={15} />{english ? "AI TRAVEL TOOLS" : "CÔNG CỤ AI DU LỊCH"}</p><h2 id="ai-assistants-title" className="section-title">{english ? "More than itinerary planning" : "Không chỉ lập kế hoạch du lịch"}</h2><p className="section-description">{english ? "Explore weather, safety and lower-impact travel advice, or compare road routes on the map." : "Xem dự báo thời tiết, gợi ý an toàn và du lịch xanh, hoặc so sánh tuyến đường ngay trên bản đồ."}</p></div>
        <div className="ai-tools-grid">
          <Link href="/ai/conditions" className="ai-tool-card"><span className="ai-tool-icon"><CloudSun size={22} /></span><span className="ai-tool-copy"><strong>{english ? "Weather, safety & green travel" : "AI thời tiết, an toàn & du lịch xanh"}</strong><p>{english ? "Regional forecast, practical preparation, incident guidance and direct emergency contacts." : "Dự báo theo vùng, gợi ý chuẩn bị, hướng dẫn sự cố và số liên hệ khẩn cấp trực tiếp."}</p><small>{english ? "Sign in for model advice · emergency contacts are available without AI" : "Đăng nhập để hỏi AI · số khẩn cấp luôn xem được, không cần chatbot"}</small></span><ArrowRight size={18} aria-hidden="true" /></Link>
          <Link href="/ai/routes" className="ai-tool-card"><span className="ai-tool-icon"><Route size={22} /></span><span className="ai-tool-copy"><strong>{english ? "AI traffic & route planning" : "AI giao thông & hành trình di chuyển"}</strong><p>{english ? "Pick stops on the map, compare fastest and shortest road estimates, and review limitations." : "Chọn điểm trên bản đồ, so sánh tuyến nhanh/ngắn và xem rõ giới hạn dữ liệu."}</p><small>{english ? "Sign in and configure OpenRouteService for live route requests" : "Cần đăng nhập và cấu hình OpenRouteService để tính tuyến thật"}</small></span><ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading"><p className="eyebrow"><Leaf size={15} />{t("curated")}</p><h2 className="section-title">{t("featured")}</h2><p className="section-description">{t("featuredText")}</p></div>
        <div className="experience-grid">
          {experiences.map(({ key, icon: Icon, vi, en, filter, filterEn }) => (
            <Link href={`/places?category=${key}`} className="experience-card" key={key}>
              <span className="experience-icon"><Icon size={20} /></span><span><strong>{english ? en : vi}</strong><p>{english ? filterEn : filter}</p></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-sm container">
        <div className="feature-band">
          <div><p className="eyebrow"><Sparkles size={15} />Journey Studio</p><h2 className="section-title">{english ? "A good trip starts with what matters to you." : "Hành trình tốt bắt đầu từ điều bạn thật sự cần."}</h2><p className="section-description">{english ? "Share a budget, places you like, or a question. NaiVerse can map your preferences to destinations, route options and source-backed information." : "Nói ngân sách, sở thích hoặc câu hỏi của bạn. NaiVerse giúp kết nối mong muốn với địa điểm, tuyến đường và thông tin có nguồn."}</p><Link className="button button-primary" style={{ marginTop: 19 }} href="/journey">{english ? "Plan with AI" : "Cùng AI lên kế hoạch"}<ArrowRight size={15} /></Link></div>
          <div className="feature-art" aria-label={english ? "Illustration of a lake, hills and sun" : "Minh họa mặt hồ, đồi xanh và mặt trời"} role="img"><LandscapeIllustration /></div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading"><p className="eyebrow">{english ? "DONG NAI, YOUR WAY" : "ĐỒNG NAI THEO CÁCH CỦA BẠN"}</p><h2 className="section-title">{english ? "A city of forests, water and local stories." : "Một thành phố của rừng, mặt nước và câu chuyện địa phương."}</h2><p className="section-description">{english ? "Start with a few well-known places. Check every detail that can change before you go." : "Bắt đầu với những điểm đến quen thuộc. Kiểm tra lại thông tin có thể thay đổi trước ngày khởi hành."}</p></div>
        <div className="place-grid">{featured.map((place) => <PlaceCard place={place} key={place.id} />)}</div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 25 }}><Link href="/places" className="button button-secondary">{t("allPlaces")}<ArrowRight size={15} /></Link></div>
      </section>

      <section className="section-sm container"><div className="section-heading"><p className="eyebrow">{t("howItWorks")}</p></div><div className="three-steps">{[
        [t("howOne"), t("howOneText")], [t("howTwo"), t("howTwoText")], [t("howThree"), t("howThreeText")],
      ].map(([title, copy], index) => <article className="step-card" key={title}><span className="step-number">{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    </>
  );
}

function LandscapeIllustration() {
  return <svg viewBox="0 0 600 320" fill="none" aria-hidden="true">
    <circle cx="440" cy="75" r="36" fill="#F0BD5E" />
    <path d="M0 177 128 82l120 110 111-93 158 94 83-69v196H0V177Z" fill="#9DBF9A" />
    <path d="m0 202 117-77 129 111 120-75 126 75 108-64v125H0V202Z" fill="#528E69" />
    <path d="M0 225c62-13 121 9 185-1 53-9 73-29 137-27 74 3 95 35 172 24 42-6 67-21 106-10v86H0v-72Z" fill="#87BBC1" />
    <path d="M0 270c66-20 132 9 197-4 80-15 117-9 184 5 79 16 144-21 219-7v56H0v-50Z" fill="#C0D9C5" />
    <path d="M107 173c20-32 48-37 74-1m198-14c24-37 60-45 91-4" stroke="#345B45" strokeWidth="7" strokeLinecap="round" />
    <path d="M112 171v43m69-43v43m195-54v47m93-45v51" stroke="#345B45" strokeWidth="5" strokeLinecap="round" />
    <path d="M273 258h47m-15 19h62m-175-6h42" stroke="#E8F1D5" strokeWidth="5" strokeLinecap="round" opacity=".8" />
  </svg>;
}
