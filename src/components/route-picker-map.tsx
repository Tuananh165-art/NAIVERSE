"use client";

import { MapContainer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useLocale } from "next-intl";
import { MapTileLayer } from "@/components/map-tile-layer";

export type RoutePin = { name: string; latitude: number; longitude: number };
const marker = L.divIcon({ className: "naiverse-marker", html: "<span></span>", iconSize: [24, 24], iconAnchor: [12, 12] });

export function RoutePickerMap({ pins, onAdd, fastest, shortest }: { pins: RoutePin[]; onAdd: (latitude: number, longitude: number) => void; fastest?: [number, number][]; shortest?: [number, number][] }) {
  const locale = useLocale();
  return <MapContainer center={[11.1, 107.1]} zoom={8} scrollWheelZoom className="map" aria-label="Click map to add route waypoints">
    <MapTileLayer locale={locale} />
    <PickOnClick onAdd={onAdd}/>
    {pins.map((pin, index) => <Marker key={`${index}-${pin.latitude}-${pin.longitude}`} position={[pin.latitude, pin.longitude]} icon={marker} title={`${index + 1}. ${pin.name}`}/ >)}
    {fastest && <Polyline positions={fastest} pathOptions={{ color: "#1671b7", weight: 4, opacity: .85 }}/ >}
    {shortest && <Polyline positions={shortest} pathOptions={{ color: "#16865b", weight: 4, opacity: .85, dashArray: "7 6" }}/ >}
  </MapContainer>;
}

function PickOnClick({ onAdd }: { onAdd: (latitude: number, longitude: number) => void }) {
  useMapEvents({ click(event) { onAdd(event.latlng.lat, event.latlng.lng); } });
  return null;
}
