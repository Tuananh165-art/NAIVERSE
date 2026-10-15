-- These are mapped feature coordinates, not surveyed entrance coordinates.
update public.places as p
set latitude = v.latitude,
    longitude = v.longitude,
    coordinate_precision = 'venue_feature',
    coordinate_source_url = v.source_url,
    coordinate_source_label = 'OpenStreetMap mapped feature; not a verified entrance or trailhead',
    coordinate_checked_at = '2026-10-15'
from (values
  ('amazing-bay', 10.87485::double precision, 106.87036::double precision, 'https://www.openstreetmap.org/way/1163348358'),
  ('chua-chan', 10.94111::double precision, 107.37937::double precision, 'https://www.openstreetmap.org/node/6961182026')
) as v(id, latitude, longitude, source_url)
where p.id = v.id;
