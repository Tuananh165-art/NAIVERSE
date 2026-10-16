"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, Polyline, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { MapTileLayer } from "@/components/map-tile-layer";
import type { Place } from "@/lib/catalog";
import type { RouteResult } from "@/lib/route";

const center: [number, number] = [11.15, 107.1];
const marker = L.divIcon({ className: "naiverse-marker", html: "<span></span>", iconSize: [24, 24], iconAnchor: [12, 12] });

export function ExploreMap({ places, route }: { places: Place[]; route?: RouteResult | null }) {
  const locale = useLocale();
  const t = useTranslations("catalog");
  const plottable = useMemo(() => places.filter((place): place is Place & { latitude: number; longitude: number } => place.latitude !== null && place.longitude !== null), [places]);

  return (
    <div>
      <MapContainer center={center} zoom={8} scrollWheelZoom={false} className="map" aria-label={locale === "en" ? "Map of Dong Nai destinations" : "Bản đồ các điểm đến Đồng Nai"}>
        <MapTileLayer locale={locale} />
        {plottable.map((place) => <Marker key={place.id} position={[place.latitude, place.longitude]} icon={marker} title={locale === "en" ? place.nameEn : place.name}><Popup><strong>{locale === "en" ? place.nameEn : place.name}</strong><br /><Link href={`/places/${place.id}`}>{locale === "en" ? "View details" : "Xem chi tiết"}</Link></Popup></Marker>)}
        {route?.geometry && <Polyline positions={route.geometry} pathOptions={{ color: "#12634b", weight: 5, opacity: .86 }} />}
        <MapResize />
        <UseMyLocation locale={locale} />
      </MapContainer>
      {plottable.length === 0 && <div className="empty-state" style={{ marginTop: 12 }}>{t("pinMissing")} {locale === "en" ? `The catalog currently has ${places.length} destinations awaiting a verified pin.` : `Danh mục hiện có ${places.length} địa điểm đang chờ đối chiếu tọa độ.`}</div>}
    </div>
  );
}

function MapResize() {
  const map = useMap();
  useEffect(() => { const id = window.setTimeout(() => map.invalidateSize(), 100); return () => window.clearTimeout(id); }, [map]);
  return null;
}

function UseMyLocation({ locale }: { locale: string }) {
  const map = useMap();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState("");
  function locate() {
    setError("");
    if (!navigator.geolocation) { setError(locale === "en" ? "Location is not supported by this browser." : "Trình duyệt không hỗ trợ GPS."); return; }
    navigator.geolocation.getCurrentPosition(
      (result) => { const point: [number, number] = [result.coords.latitude, result.coords.longitude]; setPosition(point); map.setView(point, 12); },
      () => setError(locale === "en" ? "Location permission was denied or unavailable." : "Bạn đã từ chối quyền vị trí hoặc GPS không khả dụng."),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    );
  }
  return <div className="map-location-control"><button type="button" className="button button-secondary" onClick={locate}>{locale === "en" ? "Use my location" : "Dùng vị trí của tôi"}</button>{error && <span role="status">{error}</span>}{position && <CircleMarker center={position} radius={8} pathOptions={{ color: "#12634b", fillColor: "#4bb985", fillOpacity: .8 }}><Popup>{locale === "en" ? "Your current location (kept in this browser)." : "Vị trí hiện tại (chỉ giữ trong trình duyệt này)."}</Popup></CircleMarker>}</div>;
}
