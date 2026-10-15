-- Keep opening-hours evidence readable in both supported UI locales.
alter table public.place_hours
  add column if not exists note_en text not null default '';

update public.place_hours
set note_en = case place_id
  when 'amazing-bay' then 'The official product page lists Monday–Sunday, 09:00–17:00. Holiday hours may differ; confirm with the operator before travelling.'
  when 'buu-long' then 'The venue website reports 07:00–17:00 and closure on Tuesday except public holidays. Its footer says the information is AI-written; call the venue to confirm before travelling.'
  when 'dong-nai-museum' then 'The museum page published on 18 Dec 2023 reports administrative visiting hours Tuesday–Friday, 07:00–11:00 and 13:30–17:00; other days require prior contact. The schedule has not been reconfirmed; call before visiting.'
  else note_en
end
where place_id in ('amazing-bay', 'buu-long', 'dong-nai-museum')
  and coalesce(note_en, '') = '';
