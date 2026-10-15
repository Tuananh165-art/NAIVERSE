import { BookOpenCheck, ShieldCheck, Sparkles } from "lucide-react";
import { AiGuide } from "@/components/ai-guide";
import { getCurrentUser } from "@/lib/supabase/server";
import { getPlaceCatalog } from "@/lib/catalog-server";

export default async function AiGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const en = locale === "en";
  const [user, catalog] = await Promise.all([getCurrentUser(), getPlaceCatalog()]);
  const places = catalog.map(({ id, name, nameEn }) => ({ id, name, nameEn }));

  return <div className="container section">
    <p className="eyebrow"><Sparkles size={15}/>{en ? "SOURCE-GROUNDED AI" : "AI TRA CỨU THEO NGUỒN"}</p>
    <h1 className="page-title">{en ? "NaiVerse local travel guide" : "Trợ lý tra cứu du lịch NaiVerse"}</h1>
    <p className="section-description">{en ? "Ask about a destination's catalog facts, published prices or reported hours. The guide uses only retrieved records and links its sources." : "Tra cứu dữ liệu catalog, giá được công bố hoặc giờ được nguồn nêu của một địa điểm. Trợ lý chỉ dùng bản ghi được truy xuất và dẫn liên kết nguồn."}</p>
    <div className="alert alert-blue" role="note" style={{ marginTop: 16 }}><ShieldCheck size={18}/><span>{en ? "No free-text prompt is sent. Only your selected public destination, fixed question type and relevant public records go to DeepSeek. Unknown or conflicting data stays labelled." : "Không gửi prompt tự do. Chỉ địa điểm công khai, loại câu hỏi cố định và bản ghi công khai liên quan được gửi tới DeepSeek. Dữ liệu thiếu hoặc mâu thuẫn vẫn giữ nguyên nhãn."}</span></div>
    <AiGuide signedIn={Boolean(user)} places={places}/>
    <div className="button-row" style={{ marginTop: 20 }}>
      <a className="button button-secondary" href={"/" + locale + "/places"}><BookOpenCheck size={16}/>{en ? "Browse the catalog" : "Mở danh mục"}</a>
    </div>
  </div>;
}
