-- Source-backed destination updates checked on 2026-10-15.
-- Coordinates are OSM feature points, not surveyed entrance coordinates.
update public.places as p
set latitude = v.latitude,
    longitude = v.longitude,
    coordinate_precision = 'venue_feature',
    coordinate_source_url = v.source_url,
    coordinate_source_label = 'OpenStreetMap mapped feature; not a verified entrance',
    coordinate_checked_at = '2026-10-15'
from (values
  ('buu-long', 10.9629837::double precision, 106.7936911::double precision, 'https://www.openstreetmap.org/way/972604563'),
  ('tran-bien-temple-of-literature', 10.9645068::double precision, 106.8015941::double precision, 'https://www.openstreetmap.org/way/972604565'),
  ('ong-pagoda', 10.9298894::double precision, 106.8258042::double precision, 'https://www.openstreetmap.org/node/11123066994'),
  ('giang-dien-waterfall', 10.9167480::double precision, 106.9911883::double precision, 'https://www.openstreetmap.org/way/59986402'),
  ('ma-da-reserve', 11.1107873::double precision, 107.0520631::double precision, 'https://www.openstreetmap.org/way/1065375337'),
  ('suoimo', 11.2290561::double precision, 107.4432339::double precision, 'https://www.openstreetmap.org/way/1195398460'),
  ('ba-chong-rocks', 11.1907880::double precision, 107.3484014::double precision, 'https://www.openstreetmap.org/node/9974267816'),
  ('dak-mai-waterfall', 12.0623464::double precision, 107.1841837::double precision, 'https://www.openstreetmap.org/node/11898330382')
) as v(id, latitude, longitude, source_url)
where p.id = v.id;

insert into public.place_media
  (place_id,image_url,alt_vi,alt_en,credit,source_url,license,license_url,checked_at,is_archival,approved)
values
  ('buu-long','https://commons.wikimedia.org/wiki/Special:FilePath/B%E1%BB%ADu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_(3).jpg?width=1100','Cảnh quan Bửu Long, Biên Hòa (ảnh tư liệu)','Bửu Long landscape, Biên Hòa (archival photo)','Lam Tr Th','https://commons.wikimedia.org/wiki/File:B%E1%BB%ADu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_(3).jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('buu-long','https://commons.wikimedia.org/wiki/Special:FilePath/B%E1%BB%ADu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_(6).jpg?width=1100','Hồ và núi đá tại Bửu Long (ảnh tư liệu)','Lake and limestone hills at Bửu Long (archival photo)','Lam Tr Th','https://commons.wikimedia.org/wiki/File:B%E1%BB%ADu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_(6).jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('tran-bien-temple-of-literature','https://commons.wikimedia.org/wiki/Special:FilePath/Nh%C3%A0_th%E1%BB%9D_ch%C3%ADnh_V%C4%83n_mi%E1%BA%BFu_Tr%E1%BA%A5n_Bi%C3%AAn.jpg?width=1100','Chính điện Văn miếu Trấn Biên','Main sanctuary of Tran Bien Temple of Literature','Bùi Thụy Đào Nguyên','https://commons.wikimedia.org/wiki/File:Nh%C3%A0_th%E1%BB%9F_ch%C3%ADnh_V%C4%83n_mi%E1%BA%BFu_Tr%E1%BA%A5n_Bi%C3%AAn.jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',false,true),
  ('tran-bien-temple-of-literature','https://commons.wikimedia.org/wiki/Special:FilePath/Van_mieu_Tran_Bien_Bien_Hoa.jpg?width=1100','Văn miếu Trấn Biên, Biên Hòa (ảnh tư liệu)','Tran Bien Temple of Literature, Bien Hoa (archival photo)','Thuydaonguyen','https://commons.wikimedia.org/wiki/File:Van_mieu_Tran_Bien_Bien_Hoa.jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('nguyen-huu-canh-temple','https://commons.wikimedia.org/wiki/Special:FilePath/%C4%90%E1%BB%81n_th%E1%BB%9D_Nguy%E1%BB%85n_H%E1%BB%AFu_C%E1%BA%A3nh_t%E1%BA%A1i_C%C3%B9_lao_Ph%E1%BB%91.jpg?width=1100','Đền thờ Nguyễn Hữu Cảnh tại Cù lao Phố (ảnh tư liệu)','Nguyen Huu Canh Temple on Cu Lao Pho (archival photo)','Bùi Thụy Đào Nguyên','https://commons.wikimedia.org/wiki/File:%C4%90%E1%BB%81n_th%E1%BB%9F_Nguy%E1%BB%85n_H%E1%BB%AFu_C%E1%BA%A3nh_t%E1%BA%A1i_C%C3%B9_lao_Ph%E1%BB%91.jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('ta-lai','https://commons.wikimedia.org/wiki/Special:FilePath/T%C3%A0_L%C3%A0i,_T%C3%A2n_Ph%C3%BA,_%C4%90%E1%BB%93ng_Nai,_Vietnam_-_panoramio.jpg?width=1100','Cảnh quan Tà Lài, Tân Phú (ảnh tư liệu)','Ta Lai landscape, Tan Phu (archival photo)','Lam Tr Th','https://commons.wikimedia.org/wiki/File:T%C3%A0_L%C3%A0i,_T%C3%A2n_Ph%C3%BA,_%C4%90%E1%BB%93ng_Nai,_Vietnam_-_panoramio.jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('thac-mai-bau-nuoc-soi','https://commons.wikimedia.org/wiki/Special:FilePath/TH%C3%81C_MAI-%C4%90%E1%BB%8ANH_QU%C3%81N-%C4%90%E1%BB%92NG_NAI_-_panoramio.jpg?width=1100','Thác Mai, Định Quán (ảnh tư liệu)','Thac Mai Waterfall, Dinh Quan (archival photo)','pqthong0911','https://commons.wikimedia.org/wiki/File:TH%C3%81C_MAI-%C4%90%E1%BB%8ANH_QU%C3%81N-%C4%90%E1%BB%92NG_NAI_-_panoramio.jpg','CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','2026-10-15',true,true),
  ('chua-chan','https://commons.wikimedia.org/wiki/Special:FilePath/Chua_Chan_mount..JPG?width=1100','Núi Chứa Chan (ảnh tư liệu)','Chua Chan Mountain (archival photo)','Cheers!','https://commons.wikimedia.org/wiki/File:Chua_Chan_mount..JPG','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('ba-ra-mountain','https://commons.wikimedia.org/wiki/Special:FilePath/Thac%20Mo%20-%20Nui%20Ba%20Ra.JPG?width=1100','Núi Bà Rá nhìn từ khu Thác Mơ (ảnh tư liệu năm 2015)','Ba Ra Mountain seen from the Thac Mo area (archival photo from 2015)','Scope72','https://commons.wikimedia.org/wiki/File:Thac_Mo_-_Nui_Ba_Ra.JPG','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/','2026-10-15',true,true),
  ('ba-chong-rocks','https://commons.wikimedia.org/wiki/Special:FilePath/%C4%90%C3%A1%20Ba%20Ch%E1%BB%93ng%20in%20%C4%90%E1%BB%8Bnh%20Qu%C3%A1n.jpg?width=1100','Đá Ba Chồng ở Định Quán, ảnh tư liệu năm 2025','Ba Chong Rocks in Dinh Quan, archival photo from 2025','MinhVN123','https://commons.wikimedia.org/wiki/File:%C4%90%C3%A1_Ba_Ch%E1%BB%93ng_in_%C4%90%E1%BB%8Bnh_Qu%C3%A1n.jpg','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/','2026-10-15',true,true),
  ('giang-dien-waterfall','https://commons.wikimedia.org/wiki/Special:FilePath/Giang_Dien_Waterfall.JPG?width=1100','Thác Giang Điền, Trảng Bom (ảnh tư liệu)','Giang Dien Waterfall, Trang Bom (archival photo)','Prenn','https://commons.wikimedia.org/wiki/File:Giang_Dien_Waterfall.JPG','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true)
on conflict (place_id,source_url) do nothing;

-- The national park's published schedule states it remains effective until replaced.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_from,source_url,source_label,checked_at,terms,approved)
select 'cat-tien', v.item_label, v.audience, v.amount_vnd, 'verified', '2024-06-01',
  'https://cattiennationalpark.com.vn/wp-content/uploads/2025/07/Bang-gia-2024-co-moc-dau.pdf',
  'Bảng giá Trung tâm Giáo dục Môi trường và Dịch vụ VQG Cát Tiên; hiệu lực đến khi có bảng mới', '2026-10-15', v.terms, true
from (values
  ('Vé vào Vườn (gồm một lượt phà vào và đón về)','Người lớn từ 16 tuổi',60000::bigint,'Không bao gồm các dịch vụ khác. Bảng do đơn vị quản lý công bố; xác nhận trước ngày đi.'),
  ('Vé vào Vườn','Người cao tuổi Việt Nam trên 60 tuổi có CCCD',30000::bigint,'Điều kiện và giấy tờ theo bảng giá. Xác nhận với đơn vị trước ngày đi.'),
  ('Vé vào Vườn','Sinh viên có thẻ hoặc giấy giới thiệu của trường',20000::bigint,'Điều kiện và giấy tờ theo bảng giá. Xác nhận với đơn vị trước ngày đi.'),
  ('Vé vào Vườn','Học sinh, trẻ em dưới 16 tuổi',10000::bigint,'Không bao gồm các dịch vụ khác. Xác nhận với đơn vị trước ngày đi.')
) as v(item_label,audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='cat-tien' and p.item_label=v.item_label and p.audience=v.audience
    and p.source_url='https://cattiennationalpark.com.vn/wp-content/uploads/2025/07/Bang-gia-2024-co-moc-dau.pdf'
);

-- Most recent official local-government price publication found for Bửu Long is for New Year 2026.
-- Keep it historical so it is useful as a reference but never presented as a current quote.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_from,valid_to,source_url,source_label,checked_at,terms,approved)
select 'buu-long','Vé vào cổng Bửu Long',v.audience,v.amount_vnd,'historical','2026-01-02','2026-01-02',
  'https://tranbien.dongnai.gov.vn/vi/news/du-lich-am-thuc/khu-du-lich-buu-long-don-tren-2-5-ngan-luot-du-khach-trong-ngay-dau-ky-nghi-tet-duong-lich-2026-433.html',
  'UBND phường Trấn Biên dẫn thông tin KDL Bửu Long (02/01/2026)','2026-01-02',v.terms,true
from (values
  ('Người lớn từ 1,4 m',150000::bigint,'Giá công bố dịp Tết Dương lịch 2026; chưa xác nhận lại là giá đang áp dụng hiện nay.'),
  ('Trẻ em cao 1 m–1,4 m',60000::bigint,'Giá công bố dịp Tết Dương lịch 2026; chưa xác nhận lại là giá đang áp dụng hiện nay.'),
  ('Trẻ em dưới 1 m',0::bigint,'Miễn vé theo chiều cao, công bố dịp Tết Dương lịch 2026; chưa xác nhận lại hiện nay.')
) as v(audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='buu-long' and p.audience=v.audience and p.checked_at='2026-01-02'
);
