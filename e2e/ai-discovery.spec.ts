import { expect, test } from "@playwright/test";

test("unprefixed root redirects to the Vietnamese home page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/vi\/?$/);
  await expect(page.locator("main")).toBeVisible();
});

test("explore map links to the AI road-route assistant", async ({ page }) => {
  await page.goto("/vi/places");

  const routeLink = page.getByRole("link", { name: "Lập tuyến với AI" });
  await expect(routeLink).toBeVisible();
  await expect(routeLink).toHaveAttribute("href", "/vi/ai/routes");
  await expect(page.getByText(/Pin danh mục chưa phải cổng vào đã xác minh/)).toBeVisible();

  await page.goto("/en/places");
  const englishRouteLink = page.getByRole("link", { name: "Open AI route planner" });
  await expect(englishRouteLink).toBeVisible();
  await expect(englishRouteLink).toHaveAttribute("href", "/en/ai/routes");
  await expect(page.getByText(/Catalog pins are not verified entrances/)).toBeVisible();
});

test("explore map switches to its configured backup when OSM tiles are unreachable", async ({ page }) => {
  let osmTileRequests = 0;
  let backupTileRequests = 0;

  await page.route("https://tile.openstreetmap.org/**", async (route) => {
    osmTileRequests += 1;
    await route.abort("failed");
  });
  await page.route("https://api.maptiler.com/maps/streets-v4/256/**", async (route) => {
    backupTileRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/S6sAAAAASUVORK5CYII=", "base64"),
    });
  });

  await page.goto("/vi/places");

  await expect(page.getByRole("status").filter({ hasText: "Đang dùng máy chủ bản đồ dự phòng." })).toBeVisible();
  await expect.poll(() => osmTileRequests).toBeGreaterThan(0);
  await expect.poll(() => backupTileRequests).toBeGreaterThan(0);
  await expect(page.locator(".leaflet-control-attribution")).toContainText("MapTiler");
});

test("home exposes weather/safety and map route assistants", async ({ page }) => {
  const hydrationErrors: string[] = [];
  await page.addInitScript(() => {
    document.documentElement.setAttribute("data-yd-metadata-content-site", "common");
    document.documentElement.setAttribute("data-yd-content-ready", "true");
  });
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration|didn't match|server rendered html/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });

  await page.goto("/vi");
  await expect(page.getByRole("heading", { name: "Không chỉ lập kế hoạch du lịch" })).toBeVisible();
  await expect(page.locator(".ai-tool-card[href$='/ai/conditions']")).toBeVisible();
  await expect(page.locator(".ai-tool-card[href$='/ai/routes']")).toBeVisible();
  await expect(page.locator(".hero-shortcuts a[href$='/ai/conditions']")).toBeVisible();
  await expect(page.locator(".hero-shortcuts a[href$='/ai/routes']")).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});

test("all three AI entry points remain discoverable on a phone-width screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi");

  await expect(page.locator(".hero-shortcuts a[href$='/journey']")).toContainText("AI lập kế hoạch chuyến đi");
  await expect(page.locator(".hero-shortcuts a[href$='/ai/conditions']")).toContainText("AI thời tiết, an toàn & du lịch xanh");
  await expect(page.locator(".hero-shortcuts a[href$='/ai/routes']")).toContainText("AI giao thông & hành trình");
  await expect(page.locator(".ai-tool-card[href$='/ai/conditions']")).toBeVisible();
  await expect(page.locator(".ai-tool-card[href$='/ai/routes']")).toBeVisible();
});

test("Journey Studio distinguishes bicycle from walking in Vietnamese and English", async ({ page }) => {
  await page.goto("/vi/journey");
  await expect(page.locator("select option[value='bicycle']")).toHaveText("Xe đạp");
  await expect(page.locator("select option[value='walking']")).toHaveText("Đi bộ");

  await page.goto("/en/journey");
  await expect(page.locator("select option[value='bicycle']")).toHaveText("Bicycle");
  await expect(page.locator("select option[value='walking']")).toHaveText("Walking");
});

test("place detail exposes sourced prices and hours with their uncertainty labels", async ({ page }) => {
  await page.goto("/vi/places/buu-long");

  await expect(page.getByRole("heading", { name: "Giá lịch sử, đã cũ hoặc chưa xác nhận" })).toBeVisible();
  await expect(page.getByText("Vé vào cổng Bửu Long · Lịch sử").first()).toBeVisible();
  await expect(page.getByText("100.000 ₫").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lịch nguồn công bố (chưa xác minh)" })).toBeVisible();
  await expect(page.getByText(/07:00–17:00/).first()).toBeVisible();
  await expect(page.getByText("Đối tượng bản đồ; chưa xác minh là cổng")).toBeVisible();
  await expect(page.getByText(/Way OSM 972604563 có tag opening_hours/).first()).toBeVisible();
  await expect(page.locator("a[href='https://www.openstreetmap.org/way/972604563']").first()).toBeVisible();
});

test("Giang Dien lists restaurant and hotel details without claiming whole-park hours or room availability", async ({ page }) => {
  await page.goto("/en/places/giang-dien-waterfall", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Published opening hours" })).toBeVisible();
  await expect(page.getByText(/08:00–21:00.*Hoa Su Restaurant/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Schedule reported by the source (unverified)" })).toBeVisible();
  await expect(page.getByText(/Hoang Yen Restaurant.*does not specify weekdays/i)).toBeVisible();
  await expect(page.getByText(/welcomes guests 24\/24.*does not confirm room availability/i)).toBeVisible();
  await expect(page.getByText(/operator's contact page lists.*confirm service hours, prices and availability/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Historical, stale or unconfirmed price notes" })).toBeVisible();
  await expect(page.getByText(/Phòng Khách sạn Tre Xanh.*Unconfirmed/)).toBeVisible();
  await expect(page.getByText(/550,000 ₫.*product page|550,000 ₫.*operator/i)).toBeVisible();
});

test("Giang Dien Combo 3 uses the official product page and keeps its ambiguous price unconfirmed", async ({ page }) => {
  await page.goto("/en/places/giang-dien-waterfall", { waitUntil: "domcontentloaded" });

  await expect(page.getByText(/Combo camping 03.*Unconfirmed/)).toBeVisible();
  await expect(page.getByText(/599,000.*Trang sản phẩm chính thức Combo 3/)).toBeVisible();
  await expect(page.locator("a[href='https://giangdien.vn/san-pham/leu-san-b-combo3/']")).toBeVisible();
});

test("Cat Tien detail separates admission, tour fees and a variable guide quote", async ({ page }) => {
  await page.goto("/vi/places/cat-tien");

  await expect(page.getByRole("heading", { name: "Vườn quốc gia Cát Tiên" })).toBeVisible();
  await expect(page.getByText(/Phí tham quan Bàu Sấu trong ngày/)).toBeVisible();
  await expect(page.getByText(/250\.000 ₫/).first()).toBeVisible();
  await expect(page.getByText(/550\.000–650\.000 ₫/).first()).toBeVisible();
});

test("Da Han detail labels third-party hours and conflicting prices as unconfirmed", async ({ page }) => {
  await page.goto("/vi/places/da-han-waterfall");

  await expect(page.locator("a[href='https://vietgoing.com/destination/1011-thac-da-han.html']").first()).toBeVisible();
  await expect(page.getByText(/07:00.*19:00/).first()).toBeVisible();
  await expect(page.getByText(/07:00.*17:00/).first()).toBeVisible();
  await expect(page.getByText(/50\.000\/65\.000\/75\.000/).first()).toBeVisible();
  await expect(page.getByText(/giá mâu thuẫn/).first()).toBeVisible();
});

test("the community experience group without a specific site photo uses a labelled illustration", async ({ page }) => {
  await page.goto("/vi/places");
  const placeCard = page.locator(".place-card").filter({ hasText: "Trải nghiệm nghề và ẩm thực cộng đồng" }).first();
  await expect(placeCard.locator(".place-illustration-badge")).toHaveText("Minh họa");

  await page.goto("/vi/places/community-cultural-experiences");

  await expect(page.getByRole("img", { name: /Minh họa cho Trải nghiệm nghề và ẩm thực cộng đồng/ })).toBeVisible();
  await expect(page.locator(".place-illustration-gallery figcaption")).toContainText("không phải ảnh chụp địa điểm");
});

test("user-granted local photos disclose their permission basis without inventing an author", async ({ page }) => {
  await page.goto("/vi/places/amazing-bay");
  await expect(page.getByRole("img", { name: /Các máng trượt và hồ/ })).toBeVisible();
  await expect(page.locator(".licensed-photo figcaption")).toContainText("Người dùng NaiVerse cung cấp");
  await expect(page.locator(".licensed-photo figcaption")).toContainText("Quyền sử dụng trực tiếp do người dùng xác nhận");

  await page.goto("/vi/places/bu-lach-grassland");
  await expect(page.getByRole("img", { name: /Trảng cỏ Bù Lạch với hàng cây/ })).toBeVisible();
  const buLachUserPhoto = page.locator(".licensed-photo figcaption").filter({ hasText: "Người dùng NaiVerse cung cấp" });
  await expect(buLachUserPhoto).toContainText("Người dùng NaiVerse cung cấp");
  await expect(buLachUserPhoto).toContainText("Quyền sử dụng trực tiếp do người dùng xác nhận");
});

test("Ma Da gate candidate is shown as unverified visitor access", async ({ page }) => {
  await page.goto("/vi/places/ma-da-reserve");

  await expect(page.getByText("Đối tượng bản đồ; chưa xác minh là cổng")).toBeVisible();
  await expect(page.getByText(/OSM node 9784252674 tại 11.1115345, 107.0519628/).first()).toBeVisible();
  await expect(page.locator("a[href='https://www.openstreetmap.org/node/9784252674']")).toBeVisible();
});

test("weather and safety assistant offers direct emergency contacts without AI", async ({ page }) => {
  await page.goto("/vi/ai/conditions");
  await expect(page.getByRole("heading", { name: "Chuẩn bị chuyến đi an toàn hơn" })).toBeVisible();
  await page.getByRole("button", { name: "Khẩn cấp: hiện số gọi trực tiếp" }).click();

  await expect(page.getByRole("link", { name: /113/ })).toHaveAttribute("href", "tel:113");
  await expect(page.getByRole("link", { name: /114/ })).toHaveAttribute("href", "tel:114");
  await expect(page.getByRole("link", { name: /115/ })).toHaveAttribute("href", "tel:115");
});

test("map route assistant and username registration are discoverable", async ({ page }) => {
  await page.goto("/vi/ai/routes");
  await expect(page.getByRole("heading", { name: "So sánh tuyến đường" })).toBeVisible();
  await expect(page.getByText("Nhấp chọn ít nhất hai điểm trên bản đồ.")).toBeVisible();
  await expect(page.getByRole("link", { name: "OpenStreetMap", exact: true })).toBeVisible();

  await page.goto("/vi/auth");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page.getByLabel("Tên đăng nhập")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Mật khẩu" })).toBeVisible();
});

test("the source-grounded AI guide is reachable and sends only fixed, consented choices", async ({ page }) => {
  await page.goto("/vi/ai/guide");
  await expect(page.getByRole("heading", { name: "Trợ lý tra cứu du lịch NaiVerse" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trích đoạn nguồn" })).toBeVisible();
  await expect(page.getByText("DeepSeek chọn trích đoạn nguyên văn từ hồ sơ được truy xuất.")).toBeVisible();
  await expect(page.getByLabel("Địa điểm", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Nội dung hỏi", { exact: true })).toBeVisible();
  const ask = page.getByRole("button", { name: "Hỏi trợ lý AI" });
  await expect(ask).toBeDisabled();
  await page.getByRole("checkbox").check();
  await expect(ask).toBeDisabled();
  await expect(page.getByText(/không gửi prompt tự do/i)).toBeVisible();
});

test("FairPrice Lens is discoverable in Vietnamese and English and requires consent", async ({ page }) => {
  await page.goto("/vi");
  await expect(page.locator(".ai-tool-card[href$='/ai/fair-price']")).toContainText("AI rà soát báo giá du lịch");
  await page.goto("/vi/ai/fair-price");
  await expect(page.getByRole("heading", { name: "Hiểu rõ báo giá trước khi quyết định" })).toBeVisible();
  await expect(page.getByLabel("Nội dung báo giá")).toBeVisible();
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Trích thông tin bằng AI" })).toBeDisabled();

  await page.goto("/en/ai/fair-price");
  await expect(page.getByRole("heading", { name: "Understand the quote before you decide" })).toBeVisible();
  await expect(page.getByLabel("Quote text")).toBeVisible();
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Extract details with AI" })).toBeDisabled();
});

test("AI endpoints require a signed-in user", async ({ request }) => {
  const conditions = await request.post("/api/ai/conditions", {
    data: { mode: "incident", locale: "vi", consent: true, incident: "Tôi làm thất lạc túi xách ở khu tham quan, không có nguy hiểm trực tiếp." },
  });
  expect(conditions.status()).toBe(401);

  const routes = await request.post("/api/ai/route-assist", {
    data: { locale: "vi", consent: true, purpose: "fastest", partySize: 2, childSeatNeeded: false, stops: [] },
  });
  expect(routes.status()).toBe(401);

  const packing = await request.post("/api/ai/packing", {
    data: {
      locale: "vi", consent: true, durationDays: 1, partySize: 2, transport: "car",
      interests: ["nature"], childHeightCm: null, lowMobility: false, rainyDay: false, placeIds: ["cat-tien"],
    },
  });
  expect(packing.status()).toBe(401);
});
