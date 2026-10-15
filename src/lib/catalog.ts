export type PlaceCategory = "nature" | "culture" | "family" | "food" | "stay" | "experience";
export type PlaceStatus = "reference" | "needs_confirmation" | "paused_reference";
export type Evidence = { label: string; labelEn?: string; url: string | null; checkedAt: string | null };
export type PlacePhoto = { url: string; altVi: string; altEn: string; credit: string; sourceUrl: string | null; license: string; licenseUrl: string | null; checkedAt: string; archival?: boolean; permissionBasis?: "direct_permission" };
export type Place = {
  id: string;
  name: string;
  nameEn: string;
  aliases: string[];
  region: string;
  regionEn: string;
  category: PlaceCategory;
  description: string;
  descriptionEn: string;
  status: PlaceStatus;
  statusNote: string;
  statusNoteEn: string;
  latitude: number | null;
  longitude: number | null;
  coordinatePrecision: "entrance_verified" | "venue_feature" | "approximate" | null;
  coordinateEvidence: Evidence | null;
  website: string | null;
  evidence: Evidence[];
  photos: PlacePhoto[];
  isGroup: boolean;
};

const governmentTourism = "https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html";
const cultureTourism = "https://svhttdl.dongnai.gov.vn/vi/news/du-lich/";
const amazingFaq = "https://www.sontien.com/blogs/faq";

function p(
  id: string,
  name: string,
  nameEn: string,
  aliases: string[],
  region: string,
  regionEn: string,
  category: PlaceCategory,
  description: string,
  descriptionEn: string,
  evidenceUrl: string | null = governmentTourism,
  status: PlaceStatus = "needs_confirmation",
  isGroup = false,
): Place {
  return {
    id, name, nameEn, aliases, region, regionEn, category, description, descriptionEn,
    status,
    statusNote: status === "paused_reference"
      ? "Chỉ lưu làm điểm tham khảo; phải xác minh điều kiện hoạt động trước khi ghé hoặc đặt dịch vụ."
      : "Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.",
    statusNoteEn: status === "paused_reference"
      ? "Reference only. Confirm current operations and access before visiting or booking."
      : "Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.",
    latitude: null,
    longitude: null,
    coordinatePrecision: null,
    coordinateEvidence: null,
    website: null,
    evidence: [{ label: "Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý", url: evidenceUrl, checkedAt: null }],
    photos: [],
    isGroup,
  };
}

/**
 * Initial seed derived from the 36 entries in the supplied NaiVerse concept document.
 * It intentionally contains no invented pin coordinates, opening hours, live prices or partners.
 */
export const places: Place[] = [
  p("amazing-bay", "The Amazing Bay – Vịnh Kỳ Diệu", "The Amazing Bay", ["Sơn Tiên", "Vịnh Kỳ Diệu", "Amazing Bay"], "Biên Hòa – Trấn Biên", "Bien Hoa – Tran Bien", "family", "Công viên nước. Điều kiện chiều cao, giờ hoạt động và giá cần xác nhận trực tiếp với đơn vị vận hành.", "Water park. Confirm height rules, opening hours and prices with the operator.", amazingFaq),
  p("son-tien-amazing-world", "Sơn Tiên Amazing World", "Son Tien Amazing World", ["Amazing World", "Sơn Tiên"], "Biên Hòa – Trấn Biên", "Bien Hoa – Tran Bien", "family", "Trang sản phẩm chính thức có combo Hành Tinh Lạ khung giờ đêm 17:00–21:00; giá và điều kiện theo ngày cần xác nhận trên hệ thống bán vé.", "The official product page lists a 17:00–21:00 Hanh Tinh La night combo; confirm date-specific price and eligibility on the ticket system."),
  p("buu-long", "Khu du lịch Bửu Long", "Buu Long Tourist Area", ["Bửu Long", "Hồ Long Ẩn"], "Biên Hòa – Trấn Biên", "Bien Hoa – Tran Bien", "nature", "Khu hồ, núi và trải nghiệm giải trí. Giờ hoạt động và điều kiện tiếp cận cần xác nhận.", "Lake, hills and recreational activities. Confirm hours and access."),
  p("tran-bien-temple-of-literature", "Văn miếu Trấn Biên", "Tran Bien Temple of Literature", ["Văn miếu", "Trấn Biên"], "Biên Hòa – Trấn Biên", "Bien Hoa – Tran Bien", "culture", "Di tích văn hóa – giáo dục trong danh mục ban đầu. Lịch mở cửa cần xác nhận.", "Cultural and educational heritage site in the initial catalog. Confirm opening hours.", cultureTourism),
  p("ong-pagoda", "Thất phủ cổ miếu (Chùa Ông)", "Ong Pagoda (That Phu Ancient Temple)", ["Chùa Ông", "Thất phủ cổ miếu"], "Biên Hòa – Trấn Biên", "Bien Hoa – Tran Bien", "culture", "Địa điểm tín ngưỡng; khách cần tuân thủ quy tắc do nơi quản lý thông báo.", "Religious site. Follow visiting rules posted by the site manager.", cultureTourism),
  p("nguyen-huu-canh-temple", "Đền thờ Nguyễn Hữu Cảnh", "Nguyen Huu Canh Temple", ["Đền Nguyễn Hữu Cảnh"], "Biên Hòa – Trấn Biên", "Bien Hoa – Tran Bien", "culture", "Di tích lịch sử trong danh mục nghiên cứu; lịch tham quan cần xác nhận.", "Historic site in the research catalog; confirm visiting hours.", cultureTourism),
  p("dong-nai-museum", "Bảo tàng Đồng Nai", "Dong Nai Museum", ["Bảo tàng Đồng Nai", "gốm Biên Hòa"], "Biên Hòa – Trấn Biên", "Bien Hoa – Tran Bien", "culture", "Nội dung di sản địa phương và nghề gốm cần đối chiếu tư liệu bảo tàng.", "Local heritage and Bien Hoa pottery content should be checked against museum records.", cultureTourism),
  p("tan-trieu-orchards", "Làng bưởi Tân Triều và vườn địa phương", "Tan Trieu Pomelo Orchards", ["Tân Triều", "bưởi Tân Triều", "vườn bưởi"], "Tân Triều", "Tan Trieu", "experience", "Nhóm trải nghiệm vườn, ẩm thực và sản phẩm địa phương; cần xác nhận chủ vườn, ngày đón khách và giá.", "A group of orchard, food and local-product experiences. Confirm participating farms, dates and prices.", governmentTourism, "needs_confirmation", true),
  p("nam-hue-orchard", "Làng bưởi Năm Huệ", "Nam Hue Pomelo Garden", ["Năm Huệ", "làng bưởi"], "Tân Triều", "Tan Trieu", "food", "Địa điểm ẩm thực được nêu trong tài liệu; menu, giờ và nhận khách cần xác nhận.", "Food destination cited in the brief; confirm menu, opening hours and visitor access.", governmentTourism),
  p("bo-cap-vang", "Khu du lịch sinh thái Bò Cạp Vàng", "Bo Cap Vang Ecotourism Area", ["Bò Cạp Vàng", "Đại Phước"], "Đại Phước – Nhơn Trạch", "Dai Phuoc – Nhon Trach", "experience", "Chỉ giới thiệu hoạt động sau khi xác minh cơ sở và dịch vụ đang hoạt động hợp lệ.", "List activities only after confirming the operator and current service status."),
  p("giang-dien-waterfall", "Khu du lịch Thác Giang Điền", "Giang Dien Waterfall Tourist Area", ["Thác Giang Điền", "Giang Điền"], "Trảng Bom", "Trang Bom", "nature", "Điểm thiên nhiên; cần xác nhận lịch hoạt động và điều kiện vào.", "Nature destination; confirm operating schedule and access."),
  p("tri-an-lake", "Hồ Trị An", "Tri An Lake", ["Trị An", "hồ Trị An"], "Vĩnh Cửu – Trị An", "Vinh Cuu – Tri An", "nature", "Cảnh quan hồ; hoạt động ven hồ hoặc dưới nước chỉ được gợi ý khi có đơn vị và điểm tiếp cận được xác nhận.", "Lake scenery. Suggest shore or water activities only with a confirmed operator and access point."),
  p("dao-o-dong-truong", "Đảo Ó – Đồng Trường", "Dao O – Dong Truong", ["Đảo Ó", "Đồng Trường", "Đảo Ó Đồng Trường"], "Vĩnh Cửu – Trị An", "Vinh Cuu – Tri An", "nature", "Cảnh quan tham khảo. Tài liệu nguồn ghi nhận tình trạng khai thác cần được xác minh; không tạo dịch vụ đặt chỗ.", "Reference scenery. The supplied brief flags operating status for verification; no bookable services are listed.", null, "paused_reference"),
  p("ma-da-reserve", "Khu Bảo tồn Thiên nhiên – Văn hóa Đồng Nai / Mã Đà", "Dong Nai Nature and Culture Reserve – Ma Da", ["Mã Đà", "Khu bảo tồn Đồng Nai"], "Mã Đà – Vĩnh Cửu", "Ma Da – Vinh Cuu", "nature", "Chỉ tham quan tuyến được đơn vị quản lý cho phép; cần hướng dẫn tại chỗ.", "Visit only routes permitted by the reserve; local guidance may be required.", cultureTourism),
  p("war-zone-d", "Chiến khu D", "War Zone D", ["Chiến khu D", "Căn cứ Chiến khu D"], "Vĩnh Cửu", "Vinh Cuu", "culture", "Tuyến lịch sử cần tư liệu và điều kiện tham quan được đơn vị quản lý xác nhận.", "Historic route requiring verified source material and access conditions.", cultureTourism),
  p("suoimo", "Công viên Suối Mơ", "Suoi Mo Park", ["Suối Mơ", "Suoi Mo Park"], "Tân Phú", "Tan Phu", "family", "Công viên có trải nghiệm thiên nhiên và trò chơi nước. Bảng giá chính thức 2026 áp dụng từ 01/01/2026 đến khi thay thế; bảng giá và giờ hoạt động chỉ dùng cho đúng hạng mục, hãy xác nhận trước chuyến đi.", "Nature and water-play park. Its official 2026 price sheet applies from 1 Jan 2026 until replaced; prices and activity hours are scoped to listed services, so confirm before travelling.", "https://suoimopark.com/uploads/BANG%20GIA/2026.pdf"),
  p("cat-tien", "Vườn quốc gia Cát Tiên", "Cat Tien National Park", ["Cát Tiên", "Nam Cát Tiên", "VQG Cát Tiên"], "Tân Phú – Cát Tiên", "Tan Phu – Cat Tien", "nature", "Trải nghiệm vườn quốc gia phải tuân theo chương trình, tuyến và hướng dẫn do đơn vị quản lý xác nhận.", "National park visits must follow programs, routes and guidance confirmed by park management.", "https://cattiennationalpark.com.vn/"),
  p("ta-lai", "Làng du lịch cộng đồng Tà Lài", "Ta Lai Community Tourism Village", ["Tà Lài", "Ta Lai"], "Tà Lài – Nam Cát Tiên", "Ta Lai – Nam Cat Tien", "experience", "Trải nghiệm văn hóa chỉ tổ chức với cộng đồng tự nguyện chủ trì và xác nhận nội dung.", "Cultural experiences require willing community leadership and content approval.", cultureTourism),
  p("ba-chong-rocks", "Đá Ba Chồng", "Ba Chong Rocks", ["Đá Ba Chồng", "Định Quán"], "Định Quán", "Dinh Quan", "nature", "Cảnh quan địa chất; giữ khoảng cách an toàn, không vượt khu vực hạn chế.", "Geological scenery; keep a safe distance and stay outside restricted areas."),
  p("thac-mai-bau-nuoc-soi", "Thác Mai – Bàu Nước Sôi", "Thac Mai Waterfall – Bau Nuoc Soi", ["Thác Mai", "Bàu Nước Sôi"], "Định Quán – La Ngà", "Dinh Quan – La Nga", "nature", "Tình trạng mở cửa và điều kiện tiếp cận cần xác nhận trước khi đi.", "Confirm current access and operating status before visiting."),
  p("phu-dien-fields", "Trải nghiệm đồng lúa Phú Điền", "Phu Dien Rice Fields Experience", ["Phú Điền", "đồng lúa"], "Phú Điền", "Phu Dien", "experience", "Ý tưởng trải nghiệm chỉ triển khai khi hộ dân đồng ý đón khách.", "Experience concept only; participating households must consent to receive visitors.", null, "needs_confirmation", true),
  p("la-nga-glamping", "Lưu trú ven hồ La Ngà", "La Nga Lakeside Stays", ["La Ngà", "Panorama Glamping", "Tropical Eglamping"], "La Ngà", "La Nga", "stay", "Nhóm lưu trú tham khảo. Chưa xác nhận cơ sở, phòng, điều kiện an toàn hoặc đặt chỗ.", "Reference group of stays. Operators, rooms, safety conditions and bookings are unverified.", null, "needs_confirmation", true),
  p("binh-loc-orchards", "Vườn trái cây Bình Lộc và Long Khánh", "Binh Loc and Long Khanh Orchards", ["Bình Lộc", "Long Khánh", "vườn trái cây"], "Long Khánh – Bình Lộc", "Long Khanh – Binh Loc", "experience", "Trải nghiệm vườn phụ thuộc mùa và sự đồng ý của từng nhà vườn; không có lịch/giá chung.", "Orchard visits depend on season and each farm's consent; no shared schedule or price is confirmed.", null, "needs_confirmation", true),
  p("chua-chan", "Núi Chứa Chan – Gia Lào", "Chua Chan Mountain – Gia Lao", ["Núi Chứa Chan", "Gia Lào", "Xuân Lộc"], "Xuân Lộc", "Xuan Loc", "nature", "Cần kiểm tra tuyến, thời tiết, tình trạng hoạt động và sức khỏe phù hợp.", "Check routes, weather, operating status and personal fitness before visiting.", governmentTourism),
  p("da-han-waterfall", "Thác Đá Hàn", "Da Han Waterfall", ["Thác Đá Hàn", "Đá Hàn"], "Trảng Bom", "Trang Bom", "nature", "Cổng thông tin Đồng Nai ghi địa điểm ở xã Sông Trầu, huyện Trảng Bom trong bài năm 2019. Xác nhận lại địa chỉ, tình trạng hoạt động, đường vào và điều kiện an toàn với cơ sở trước chuyến đi.", "A 2019 Dong Nai government article places the site in Song Trau, Trang Bom. Confirm the address, current operations, access and safety conditions with the venue before travelling.", "https://dongnai.gov.vn/vi/wcag/Chuong-trinh-Ke-hoach-phat-trien-KTXH/du-lich-dong-nai-nhieu-thac-dep-noi-tieng-2788.html"),
  p("long-khanh-fruit-festival", "Lễ hội trái cây Long Khánh", "Long Khanh Fruit Festival", ["Mùa trái cây Long Khánh"], "Long Khánh", "Long Khanh", "experience", "Sự kiện có tính thời vụ; chỉ hiển thị lịch khi nhà tổ chức công bố.", "Seasonal event; show dates only when published by the organizer.", governmentTourism),
  p("bu-gia-map", "Vườn quốc gia Bù Gia Mập", "Bu Gia Map National Park", ["Bù Gia Mập", "VQG Bù Gia Mập"], "Bù Gia Mập", "Bu Gia Map", "nature", "Chỉ đi tuyến có hướng dẫn và chấp thuận của đơn vị quản lý vườn.", "Use only routes and guides approved by park management.", "https://svhttdl.dongnai.gov.vn/vi/news/du-lich/"),
  p("soc-bom-bo", "Di tích Sóc Bom Bo", "Soc Bom Bo Heritage Site", ["Sóc Bom Bo", "Bom Bo", "đồng bào S'tiêng"], "Bù Đăng – Bom Bo", "Bu Dang – Bom Bo", "culture", "Hoạt động văn hóa cần cộng đồng tự nguyện tổ chức và kiểm duyệt nội dung.", "Cultural activities must be voluntarily organized by the community, which reviews the content.", cultureTourism),
  p("bu-lach-grassland", "Trảng cỏ Bù Lạch", "Bu Lach Grassland", ["Bù Lạch", "trảng cỏ"], "Bù Đăng", "Bu Dang", "nature", "Xác minh quyền tiếp cận và tuyến vào; không đi xe vào vùng cỏ nhạy cảm.", "Confirm access rights and routes; do not drive onto sensitive grassland."),
  p("ba-ra-mountain", "Núi Bà Rá", "Ba Ra Mountain", ["Bà Rá", "Phước Long"], "Phước Long", "Phuoc Long", "nature", "Tuyến và dịch vụ hỗ trợ cần xác nhận. Không khẳng định cáp treo đang hoạt động.", "Confirm routes and services. No cable car operation is assumed."),
  p("thac-mo-lake", "Hồ Thác Mơ", "Thac Mo Lake", ["Hồ Thác Mơ", "Thác Mơ"], "Phước Long", "Phuoc Long", "nature", "Chỉ tiếp cận khu vực được phép; tránh hạ tầng vận hành.", "Access permitted areas only; stay away from operating infrastructure."),
  p("ta-thiet", "Di tích Căn cứ Tà Thiết", "Ta Thiet Base Heritage Site", ["Tà Thiết", "Lộc Ninh"], "Lộc Ninh", "Loc Ninh", "culture", "Tuyến giáo dục lịch sử; lịch tham quan cần xác nhận với đơn vị quản lý.", "Historic learning destination; confirm visiting times with its manager.", cultureTourism),
  p("loc-ninh-meeting-house", "Nhà Giao tế Lộc Ninh", "Loc Ninh Meeting House", ["Nhà Giao tế", "Lộc Ninh"], "Lộc Ninh", "Loc Ninh", "culture", "Di tích lịch sử trong danh mục nghiên cứu; lịch mở cửa cần xác nhận.", "Historic site in the research catalog; confirm visiting hours.", cultureTourism),
  p("my-le-eco-resort", "Khu du lịch sinh thái Mỹ Lệ", "My Le Ecotourism Area", ["Mỹ Lệ", "Phước Long"], "Phước Long", "Phuoc Long", "experience", "Chỉ thể hiện dịch vụ sau khi cơ sở xác nhận đang hoạt động và nhận khách.", "List services only after the operator confirms that it is open to visitors."),
  p("dak-mai-waterfall", "Thác Đắk Mai", "Dak Mai Waterfall", ["Đắk Mai", "Bù Gia Mập"], "Bù Gia Mập", "Bu Gia Map", "nature", "Cần đơn vị tổ chức, quyền tiếp cận và hướng dẫn phù hợp với quy định bảo tồn.", "Requires an authorized operator, approved access and conservation-compliant guidance."),
  p("community-cultural-experiences", "Trải nghiệm nghề và ẩm thực cộng đồng", "Community-led Crafts and Food", ["S'tiêng", "M'nông", "Chơro", "Mạ"], "Nhiều địa bàn", "Multiple areas", "experience", "Nhóm trải nghiệm chỉ được giới thiệu khi cộng đồng chủ trì và đồng ý nội dung, lịch.", "Introduce experiences only when the community leads and approves their content and schedule.", cultureTourism, "needs_confirmation", true),
];

// Real images with creator/license attribution. Archival images are explicitly labeled.
const commons = (filename: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=1100`;
const userProvidedPermission = {
  credit: "Người dùng NaiVerse cung cấp; tác giả chưa được cung cấp",
  sourceUrl: null,
  license: "Quyền sử dụng trực tiếp do người dùng xác nhận",
  licenseUrl: null,
  checkedAt: "2026-10-15",
  permissionBasis: "direct_permission" as const,
};
const licensedPhotos: Record<string, PlacePhoto[]> = {
  "amazing-bay": [{ url: "/images/places/amazing-bay.jpg", altVi: "Các máng trượt và hồ tại The Amazing Bay; ảnh người dùng cung cấp, không xác nhận tình trạng hoạt động hiện nay", altEn: "Slides and pools at The Amazing Bay; supplied by the user, not evidence of current operation", ...userProvidedPermission }],
  "son-tien-amazing-world": [{ url: "/images/places/son-tien-amazing-world.jpg", altVi: "Tượng rồng trang trí tại Sơn Tiên Amazing World; ảnh người dùng cung cấp", altEn: "Decorative dragon sculpture at Son Tien Amazing World; supplied by the user", ...userProvidedPermission }],
  "ong-pagoda": [{ url: "/images/places/ong-pagoda.jpg", altVi: "Mặt tiền Thất phủ cổ miếu (Chùa Ông) tại Biên Hòa; ảnh người dùng cung cấp", altEn: "Front façade of That Phu Ancient Temple (Ong Pagoda) in Bien Hoa; supplied by the user", ...userProvidedPermission }],
  "ta-thiet": [{ url: "/images/places/ta-thiet.jpg", altVi: "Khu tưởng niệm tại Di tích Căn cứ Tà Thiết; ảnh người dùng cung cấp", altEn: "Memorial area at Ta Thiet Base Heritage Site; supplied by the user", ...userProvidedPermission }],
  "phu-dien-fields": [{ url: "/images/places/phu-dien-fields.jpg", altVi: "Ruộng lúa xanh tại Phú Điền; ảnh người dùng cung cấp, chưa xác minh hộ dân hoặc lối đón khách", altEn: "Green rice field in Phu Dien; supplied by the user, participating household and visitor access unverified", ...userProvidedPermission }],
  "my-le-eco-resort": [{ url: "/images/places/my-le-eco-resort.jpg", altVi: "Cảnh quan có biển tên Mỹ Lệ; ảnh người dùng cung cấp, không xác nhận dịch vụ đang hoạt động", altEn: "Landscape with a My Le sign; supplied by the user, not evidence that services currently operate", ...userProvidedPermission }],
  "nam-hue-orchard": [{ url: "/images/places/nam-hue-orchard.jpg", altVi: "Biển hiệu Làng bưởi Năm Huệ; ảnh người dùng cung cấp", altEn: "Nam Hue Pomelo Garden sign; supplied by the user", ...userProvidedPermission }],
  "tan-trieu-orchards": [{ url: "/images/places/tan-trieu-orchards.jpg", altVi: "Cổng và bảng giới thiệu du lịch sinh thái vườn ở Tân Triều; ảnh người dùng cung cấp, không xác nhận hộ vườn đang đón khách", altEn: "Entrance and sign for an orchard ecotourism site in Tan Trieu; supplied by the user, not evidence of current visitor access", ...userProvidedPermission }],
  "long-khanh-fruit-festival": [{ url: "/images/places/long-khanh-fruit-festival.jpg", altVi: "Khách thu hoạch chôm chôm trong vườn ở Long Khánh; ảnh người dùng cung cấp, không xác nhận thời điểm hoặc chương trình lễ hội", altEn: "A visitor picking rambutan in a Long Khanh orchard; supplied by the user, not evidence of a festival date or program", ...userProvidedPermission }],
  "loc-ninh-meeting-house": [{ url: "/images/places/loc-ninh-meeting-house.jpg", altVi: "Tòa nhà và tượng tại Nhà Giao tế Lộc Ninh; ảnh người dùng cung cấp", altEn: "Building and statue at Loc Ninh Meeting House; supplied by the user", ...userProvidedPermission }],
  "dak-mai-waterfall": [{ url: "/images/places/dak-mai-waterfall.jpg", altVi: "Thác Đắk Mai; ảnh người dùng cung cấp, không xác nhận lối vào hoặc mức nước hiện nay", altEn: "Dak Mai Waterfall; supplied by the user, not evidence of current access or water conditions", ...userProvidedPermission }],
  "da-han-waterfall": [{ url: "/images/places/da-han-waterfall.jpg", altVi: "Thác và hồ nước tại Thác Đá Hàn; ảnh người dùng cung cấp, không xác nhận tình trạng hoạt động", altEn: "Waterfall and pool at Da Han; supplied by the user, not evidence of current operation", ...userProvidedPermission }],
  "binh-loc-orchards": [{ url: "/images/places/binh-loc-orchards.jpg", altVi: "Khách tham quan vườn cây ăn trái tại Bình Lộc; ảnh người dùng cung cấp, không xác nhận cơ sở cụ thể đang nhận khách", altEn: "Visitors among fruit trees in Binh Loc; supplied by the user, not evidence that a specific farm currently accepts visitors", ...userProvidedPermission }],
  "dong-nai-museum": [{ url: commons("Dong Nai Museum facade.jpg"), altVi: "Mặt tiền Bảo tàng Đồng Nai nhìn từ Quảng trường tỉnh, ảnh tư liệu năm 2022", altEn: "Dong Nai Museum façade from the provincial square, archival photo from 2022", credit: "Hoangkid", sourceUrl: "https://commons.wikimedia.org/wiki/File:Dong_Nai_Museum_facade.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", checkedAt: "2026-10-15", archival: true }],
  "bo-cap-vang": [{ url: commons("KDL Bò Cạp Vàng.jpg"), altVi: "Khu du lịch sinh thái Bò Cạp Vàng, ảnh tư liệu năm 2008", altEn: "Bo Cap Vang ecotourism area, archival photo from 2008", credit: "Prenn", sourceUrl: "https://commons.wikimedia.org/wiki/File:KDL_Bò_Cạp_Vàng.jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true }],
  "bu-lach-grassland": [
    { url: "/images/places/bu-lach-grassland.jpg", altVi: "Trảng cỏ Bù Lạch với hàng cây; ảnh do người dùng NaiVerse cung cấp, giữ nguyên watermark, không xác nhận quyền tiếp cận hiện nay", altEn: "Bu Lach grassland with tree cover; supplied by a NaiVerse user, watermark retained, not evidence of current access", ...userProvidedPermission },
    { url: commons("Trảng cỏ Bù Lạch bình phước mùa khô buổi tối - panoramio (8).jpg"), altVi: "Trảng cỏ Bù Lạch trong mùa khô, ảnh tư liệu năm 2015", altEn: "Bu Lach grassland in the dry season, archival photo from 2015", credit: "Lam Tr Th", sourceUrl: "https://commons.wikimedia.org/wiki/File:Trảng_cỏ_Bù_Lạch_bình_phước_mùa_khô_buổi_tối_-_panoramio_(8).jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true },
  ],
  "war-zone-d": [
    { url: commons("Đường Chiến Khu D - panoramio.jpg"), altVi: "Con đường ở Chiến khu D, ảnh tư liệu năm 2015", altEn: "A road in War Zone D, archival photo from 2015", credit: "Lam Tr Th", sourceUrl: "https://commons.wikimedia.org/wiki/File:Đường_Chiến_Khu_D_-_panoramio.jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true },
    { url: commons("Chiến Khu Đ năm 2019 (rừng Mã Đà).jpg"), altVi: "Rừng Mã Đà tại Chiến khu D, ảnh tư liệu chụp năm 2019", altEn: "Ma Da forest in War Zone D, archival photo taken in 2019", credit: "Phương Huy", sourceUrl: "https://commons.wikimedia.org/wiki/File:Chiến_Khu_Đ_năm_2019_(rừng_Mã_Đà).jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", checkedAt: "2026-10-15", archival: true },
  ],
  "ma-da-reserve": [{ url: commons("Chiến Khu Đ năm 2019 (rừng Mã Đà).jpg"), altVi: "Rừng Mã Đà trong khu vực Chiến khu D, ảnh tư liệu chụp năm 2019; không thể hiện cổng vào hay hiện trạng hiện nay", altEn: "Ma Da forest in the War Zone D area, archival photo from 2019; not an entrance or a current-condition image", credit: "Phương Huy", sourceUrl: "https://commons.wikimedia.org/wiki/File:Chiến_Khu_Đ_năm_2019_(rừng_Mã_Đà).jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", checkedAt: "2026-10-15", archival: true }],
  "cat-tien": [
    { url: commons("Cat Tien National Park, Vietnam.jpg"), altVi: "Cảnh quan tại Vườn quốc gia Cát Tiên", altEn: "Landscape in Cát Tiên National Park", credit: "Vyacheslav Argenberg", sourceUrl: "https://commons.wikimedia.org/wiki/File:Cat_Tien_National_Park,_Vietnam.jpg", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", checkedAt: "2026-10-15", archival: true },
    { url: commons("Cat Tien Nat Park B 2021-11-06 by 1April1950.jpg"), altVi: "Hồ Cá Sấu trong Vườn quốc gia Cát Tiên, ảnh năm 2021", altEn: "Crocodile Lake in Cát Tiên National Park, photographed in 2021", credit: "1April1950", sourceUrl: "https://commons.wikimedia.org/wiki/File:Cat_Tien_Nat_Park_B_2021-11-06_by_1April1950.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", checkedAt: "2026-10-15", archival: true },
  ],
  "suoimo": [{
    url: "https://images.pexels.com/photos/11096564/pexels-photo-11096564.jpeg?auto=compress&dpr=1&h=750&w=1260",
    altVi: "Ảnh chụp từ trên cao Công viên Suối Mơ với khu vực vui chơi dưới nước",
    altEn: "Aerial photo of Suoi Mo Park and its water recreation area",
    credit: "Chàng Trai Nông Thôn",
    sourceUrl: "https://www.pexels.com/photo/aerial-shot-of-a-nature-resort-11096564/",
    license: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
    checkedAt: "2026-10-15",
  }],
  "la-nga-glamping": [{ url: commons("La Ngà, Định Quán, Đồng Nai, Vietnam - panoramio (1).jpg"), altVi: "Cảnh quan khu vực La Ngà, ảnh tư liệu năm 2015; không phải ảnh cơ sở lưu trú", altEn: "Archival landscape of the La Nga area from 2015; not a lodging property photo", credit: "Lam Tr Th", sourceUrl: "https://commons.wikimedia.org/wiki/File:La_Ng%C3%A0,_Đ%E1%BB%8Bnh_Qu%C3%A1n,_Đ%E1%BB%93ng_Nai,_Vietnam_-_panoramio_(1).jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true }],
  "tri-an-lake": [{ url: commons("Ho Tri An.jpg"), altVi: "Hồ Trị An", altEn: "Hồ Trị An reservoir", credit: "Thien1908", sourceUrl: "https://commons.wikimedia.org/wiki/File:Ho_Tri_An.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", checkedAt: "2026-10-15" }],
  "thac-mo-lake": [{ url: commons("Hồ Thác Mơ Bình Phước - panoramio (8).jpg"), altVi: "Hồ Thác Mơ, ảnh tư liệu năm 2015", altEn: "Thac Mo reservoir, archival photo from 2015", credit: "Lam Tr Th", sourceUrl: "https://commons.wikimedia.org/wiki/File:Hồ_Thác_Mơ_Bình_Phước_-_panoramio_(8).jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true }],
  "soc-bom-bo": [{ url: commons("Điểu Ong.jpg"), altVi: "Tượng Anh hùng lực lượng vũ trang Điểu Ong tại khu bảo tồn văn hóa Sóc Bom Bo, ảnh tư liệu năm 2017", altEn: "Statue of armed forces hero Dieu Ong at the Soc Bom Bo cultural reserve, archival photo from 2017", credit: "Kieprongbuon812", sourceUrl: "https://commons.wikimedia.org/wiki/File:Điểu_Ong.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", checkedAt: "2026-10-15", archival: true }],
  "dao-o-dong-truong": [{ url: commons("Đảo Ó ở Đồng Nai th9n2019 (hồ Trị An, bến thuyền) (7).jpg"), altVi: "Đảo Ó và bến thuyền hồ Trị An, ảnh tư liệu năm 2019", altEn: "Đảo Ó and a boat landing on hồ Trị An, archival photo from 2019", credit: "Phương Huy", sourceUrl: "https://commons.wikimedia.org/wiki/File:Đảo_Ó_ở_Đồng_Nai_th9n2019_(hồ_Trị_An,_bến_thuyền)_(7).jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", checkedAt: "2026-10-15", archival: true }],
  "buu-long": [
    { url: commons("Bửu Long, Bien Hoa, Dong Nai, Vietnam - panoramio (10).jpg"), altVi: "Bửu Long, Biên Hòa, Đồng Nai (ảnh tư liệu)", altEn: "Bửu Long, Biên Hòa, Đồng Nai (archival photo)", credit: "Lam Tr Th", sourceUrl: "https://commons.wikimedia.org/wiki/File:Bửu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_(10).jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true },
    { url: commons("Bửu Long, Bien Hoa, Dong Nai, Vietnam - panoramio (3).jpg"), altVi: "Cảnh quan Bửu Long, Biên Hòa (ảnh tư liệu)", altEn: "Bửu Long landscape, Biên Hòa (archival photo)", credit: "Lam Tr Th", sourceUrl: "https://commons.wikimedia.org/wiki/File:Bửu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_(3).jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true },
    { url: commons("Bửu Long, Bien Hoa, Dong Nai, Vietnam - panoramio (6).jpg"), altVi: "Hồ và núi đá tại Bửu Long (ảnh tư liệu)", altEn: "Lake and limestone hills at Bửu Long (archival photo)", credit: "Lam Tr Th", sourceUrl: "https://commons.wikimedia.org/wiki/File:Bửu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_(6).jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true },
  ],
  "tran-bien-temple-of-literature": [
    { url: commons("Nhà thờ chính Văn miếu Trấn Biên.jpg"), altVi: "Chính điện Văn miếu Trấn Biên", altEn: "Main sanctuary of Tran Bien Temple of Literature", credit: "Bùi Thụy Đào Nguyên", sourceUrl: "https://commons.wikimedia.org/wiki/File:Nhà_thờ_chính_Văn_miếu_Trấn_Biên.jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15" },
    { url: commons("Van mieu Tran Bien Bien Hoa.jpg"), altVi: "Văn miếu Trấn Biên, Biên Hòa", altEn: "Tran Bien Temple of Literature, Bien Hoa", credit: "Thuydaonguyen", sourceUrl: "https://commons.wikimedia.org/wiki/File:Van_mieu_Tran_Bien_Bien_Hoa.jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true },
    { url: commons("Văn Miếu Môn.jpg"), altVi: "Cổng chính Văn Miếu Trấn Biên, ảnh tư liệu từ năm 2009", altEn: "Main gate of Tran Bien Temple of Literature, archival photo from 2009", credit: "Thuydaonguyen", sourceUrl: "https://commons.wikimedia.org/wiki/File:Văn_Miếu_Môn.jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true },
  ],
  "nguyen-huu-canh-temple": [{ url: commons("Đền thờ Nguyễn Hữu Cảnh tại Cù lao Phố.jpg"), altVi: "Đền thờ Nguyễn Hữu Cảnh tại Cù lao Phố", altEn: "Nguyen Huu Canh Temple on Cu Lao Pho", credit: "Bùi Thụy Đào Nguyên", sourceUrl: "https://commons.wikimedia.org/wiki/File:Đền_thờ_Nguyễn_Hữu_Cảnh_tại_Cù_lao_Phố.jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true }],
  "ta-lai": [{ url: commons("Tà Lài, Tân Phú, Đồng Nai, Vietnam - panoramio.jpg"), altVi: "Cảnh quan Tà Lài, Tân Phú (ảnh tư liệu)", altEn: "Ta Lai landscape, Tan Phu (archival photo)", credit: "Lam Tr Th", sourceUrl: "https://commons.wikimedia.org/wiki/File:Tà_Lài,_Tân_Phú,_Đồng_Nai,_Vietnam_-_panoramio.jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true }],
  "thac-mai-bau-nuoc-soi": [{ url: commons("THÁC MAI-ĐỊNH QUÁN-ĐỒNG NAI - panoramio.jpg"), altVi: "Thác Mai, Định Quán (ảnh tư liệu)", altEn: "Thac Mai Waterfall, Dinh Quan (archival photo)", credit: "pqthong0911", sourceUrl: "https://commons.wikimedia.org/wiki/File:TH%C3%81C_MAI-%C4%90%E1%BB%8ANH_QU%C3%81N-%C4%90%E1%BB%92NG_NAI_-_panoramio.jpg", license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/", checkedAt: "2026-10-15", archival: true }],
  "chua-chan": [{ url: commons("Chua Chan mount..JPG"), altVi: "Núi Chứa Chan (ảnh tư liệu)", altEn: "Chua Chan Mountain (archival photo)", credit: "Cheers!", sourceUrl: "https://commons.wikimedia.org/wiki/File:Chua_Chan_mount..JPG", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true }],
  "ba-ra-mountain": [{ url: commons("Thac Mo - Nui Ba Ra.JPG"), altVi: "Núi Bà Rá nhìn từ khu Thác Mơ (ảnh tư liệu năm 2015)", altEn: "Ba Ra Mountain seen from the Thac Mo area (archival photo from 2015)", credit: "Scope72", sourceUrl: "https://commons.wikimedia.org/wiki/File:Thac_Mo_-_Nui_Ba_Ra.JPG", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", checkedAt: "2026-10-15", archival: true }],
  "bu-gia-map": [{ url: commons("Bù Gia Mập, Binh Phuoc province, Vietnam.jpg"), altVi: "Cảnh quan Bù Gia Mập, ảnh tư liệu chụp ngày 29/03/2012", altEn: "Landscape in Bu Gia Map, archival photograph from 29 March 2012", credit: "TuanUt", sourceUrl: "https://commons.wikimedia.org/wiki/File:Bù_Gia_Mập,_Binh_Phuoc_province,_Vietnam.jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true }],
  "ba-chong-rocks": [{ url: commons("Đá Ba Chồng in Định Quán.jpg"), altVi: "Đá Ba Chồng ở Định Quán, ảnh tư liệu năm 2025", altEn: "Ba Chong Rocks in Dinh Quan, archival photo from 2025", credit: "MinhVN123", sourceUrl: "https://commons.wikimedia.org/wiki/File:Đá_Ba_Chồng_in_Định_Quán.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", checkedAt: "2026-10-15", archival: true }],
  "giang-dien-waterfall": [
    { url: commons("Giang Dien Waterfall.JPG"), altVi: "Thác Giang Điền, Trảng Bom (ảnh tư liệu)", altEn: "Giang Dien Waterfall, Trang Bom (archival photo)", credit: "Prenn", sourceUrl: "https://commons.wikimedia.org/wiki/File:Giang_Dien_Waterfall.JPG", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true },
    { url: commons("Giang Điền, Trảng Bom, Đồng Nai, Vietnam - panoramio.jpg"), altVi: "Thác Giang Điền, Trảng Bom (ảnh tư liệu)", altEn: "Giang Dien Waterfall, Trang Bom (archival photo)", credit: "Lam Tr Th", sourceUrl: "https://commons.wikimedia.org/wiki/File:Giang_Điền,_Trảng_Bom,_Đồng_Nai,_Vietnam_-_panoramio.jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", checkedAt: "2026-10-15", archival: true },
  ],
};
for (const place of places) place.photos = licensedPhotos[place.id] ?? [];

const openStreetMapFeatures: Record<string, { latitude: number; longitude: number; precision: Place["coordinatePrecision"]; url: string }> = {
  "amazing-bay": { latitude: 10.87485, longitude: 106.87036, precision: "venue_feature", url: "https://www.openstreetmap.org/way/1163348358" },
  "buu-long": { latitude: 10.9629837, longitude: 106.7936911, precision: "venue_feature", url: "https://www.openstreetmap.org/way/972604563" },
  "tran-bien-temple-of-literature": { latitude: 10.9645068, longitude: 106.8015941, precision: "venue_feature", url: "https://www.openstreetmap.org/way/972604565" },
  "ong-pagoda": { latitude: 10.9298894, longitude: 106.8258042, precision: "venue_feature", url: "https://www.openstreetmap.org/node/11123066994" },
  "giang-dien-waterfall": { latitude: 10.9167480, longitude: 106.9911883, precision: "venue_feature", url: "https://www.openstreetmap.org/way/59986402" },
  "ma-da-reserve": { latitude: 11.1107873, longitude: 107.0520631, precision: "venue_feature", url: "https://www.openstreetmap.org/way/1065375337" },
  "suoimo": { latitude: 11.2290561, longitude: 107.4432339, precision: "venue_feature", url: "https://www.openstreetmap.org/way/1195398460" },
  "chua-chan": { latitude: 10.94111, longitude: 107.37937, precision: "venue_feature", url: "https://www.openstreetmap.org/node/6961182026" },
  "ba-chong-rocks": { latitude: 11.1907880, longitude: 107.3484014, precision: "venue_feature", url: "https://www.openstreetmap.org/node/9974267816" },
  "dak-mai-waterfall": { latitude: 12.0623464, longitude: 107.1841837, precision: "venue_feature", url: "https://www.openstreetmap.org/node/11898330382" },
};
for (const place of places) {
  const feature = openStreetMapFeatures[place.id];
  if (!feature) continue;
  place.latitude = feature.latitude;
  place.longitude = feature.longitude;
  place.coordinatePrecision = feature.precision;
  place.coordinateEvidence = { label: "Đối tượng địa lý OSM; tọa độ không đại diện cổng vào", url: feature.url, checkedAt: "2026-10-15" };
}

const placeSourceNotes: Record<string, Evidence[]> = {
  "son-tien-amazing-world": [{ label: "Trang sản phẩm chính thức ghi combo Hành Tinh Lạ khung giờ đêm 17:00–21:00, hiển thị 45.000 ₫ vé trẻ em và 90.000 ₫ vé người lớn; trang chưa nêu tiêu chí tuổi/chiều cao cho loại vé trẻ em", labelEn: "Official product page lists the Hanh Tinh La night combo 17:00–21:00 at VND 45,000 for child and VND 90,000 for adult tickets; child eligibility criteria are not stated", url: "https://www.sontien.com/products/tham-quan-amazing-world", checkedAt: "2026-10-15" }],
  "amazing-bay": [
    { label: "FAQ nhà vận hành: dịp lễ 30/4–1/5 thường hoạt động 08:00–21:00; không phải lịch tuần đã xác nhận", labelEn: "Operator FAQ: during the 30/4–1/5 holiday period, hours are typically 08:00–21:00; not a confirmed weekly schedule", url: amazingFaq, checkedAt: "2026-10-15" },
    { label: "Trang vị trí nhà vận hành nói cổng vào nằm bên phải Quốc lộ 51 theo hướng Ngã ba Vũng Tàu về Long Thành; trang không công bố tọa độ cổng, nên pin OSM vẫn chỉ là đối tượng địa lý", labelEn: "The operator's location page says the entrance is on the right side of Highway 51 when travelling from Vung Tau Junction toward Long Thanh; it gives no gate coordinates, so the OSM pin remains a venue feature", url: "https://www.theamazingbay.com/gioi-thieu/vi-tri", checkedAt: "2026-10-15" },
  ],
  "buu-long": [
    { label: "Báo Đồng Nai dẫn Ban Giám đốc công bố giờ 07:00–17:00, nghỉ thứ Ba trừ lễ/Tết ngày 07/08/2026; chưa xác nhận lại", labelEn: "Báo Đồng Nai quoted the venue director on 07:00–17:00 hours, closed Tuesdays except holidays, on 7 Aug 2026; not reconfirmed", url: "https://baodongnai.com.vn/giai-tri/202608/khu-du-lich-buu-long-duy-tri-uu-dai-mua-he-den-het-thang-8-0c5211b/", checkedAt: "2026-08-07" },
    { label: "UBND phường Trấn Biên công bố giá vé dịp Tết Dương lịch 2026; đây là giá lịch sử, chưa phải giá hiện hành", labelEn: "Tran Bien Ward People's Committee reports ticket prices for New Year 2026; historical, not a current quote", url: "https://tranbien.dongnai.gov.vn/vi/news/du-lich-am-thuc/khu-du-lich-buu-long-don-tren-2-5-ngan-luot-du-khach-trong-ngay-dau-ky-nghi-tet-duong-lich-2026-433.html", checkedAt: "2026-01-02" },
    { label: "Way OSM 972604563 có tag opening_hours=Mo,We-Su 07:00-17:00, Tu off. Đây là dữ liệu cộng đồng, chưa được nhà vận hành xác nhận; way không có node entrance/barrier được gắn trên ranh giới. Không dùng tag này để xác nhận giờ hiện hành hoặc tọa độ cổng.", labelEn: "OSM way 972604563 has opening_hours=Mo,We-Su 07:00-17:00, Tu off. This is community mapping, not operator confirmation; no entrance/barrier node is tagged on the way boundary. Do not treat it as verified current hours or an entrance coordinate.", url: "https://www.openstreetmap.org/way/972604563", checkedAt: "2026-10-15" },
  ],
  "ma-da-reserve": [{ label: "OSM node 9784252674 tại 11.1115345, 107.0519628 được gắn barrier=gate và là node chung với way cơ quan chính phủ cùng hai way hàng rào. Chưa có tag xác nhận khách du lịch được vào; đây chỉ là ứng viên cổng cơ sở, không phải cổng đón khách đã xác minh. Pin vẫn thể hiện đối tượng khu bảo tồn.", labelEn: "OSM node 9784252674 at 11.1115345, 107.0519628 is tagged barrier=gate and shared with the reserve government-office way and two fence ways. No tag confirms tourist access; this is only a facility-gate candidate, not a verified visitor entrance. The map pin remains the reserve feature.", url: "https://www.openstreetmap.org/node/9784252674", checkedAt: "2026-10-15" }],
  "cat-tien": [{ label: "Bảng giá của VQG nêu giá còn hiệu lực đến khi có bảng mới; xác nhận với đơn vị trước khi đi", labelEn: "The national park's published price schedule remains effective until replaced; confirm before travel", url: "https://cattiennationalpark.com.vn/wp-content/uploads/2025/07/Bang-gia-2024-co-moc-dau.pdf", checkedAt: "2026-10-15" }],
  "giang-dien-waterfall": [{ label: "Trang liên hệ nhà vận hành công bố tổng đài 0251 392 3930, hotline 0912 810 028 / 0911 980 931 và email kinhdoanh@giangdien.vn; dùng để xác nhận giờ dịch vụ, giá và chỗ trống", labelEn: "The operator's contact page lists 0251 392 3930, hotlines 0912 810 028 / 0911 980 931 and kinhdoanh@giangdien.vn; contact them to confirm service hours, prices and availability", url: "https://giangdien.vn/lien-he/", checkedAt: "2026-10-15" }],
};
for (const place of places) place.evidence.push(...(placeSourceNotes[place.id] ?? []));

export function placeMatches(place: Place, query: string): boolean {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const haystack = normalize([place.name, place.nameEn, place.region, place.regionEn, ...place.aliases].join(" "));
  return normalize(query).trim().split(/\s+/).filter(Boolean).every((word) => haystack.includes(word));
}

export function getPlace(id: string): Place | undefined {
  return places.find((place) => place.id === id);
}
