"use client";

import { useState } from "react";
import { TileLayer } from "react-leaflet";
import { createMapTileSources } from "@/lib/map-tiles";

const sources = createMapTileSources({
  provider: process.env.NEXT_PUBLIC_MAP_TILE_PROVIDER,
  osmUrl: process.env.NEXT_PUBLIC_MAP_TILE_URL,
  osmAttribution: process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION,
  mapTilerKey: process.env.NEXT_PUBLIC_MAPTILER_KEY,
});

export function MapTileLayer({ locale }: { locale: string }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const source = sources[sourceIndex];
  const isEnglish = locale === "en";
  const hasBackupProvider = sources.some((tileSource) => tileSource.id === "maptiler");

  function handleTileError() {
    if (sourceIndex + 1 < sources.length) {
      setSourceIndex(sourceIndex + 1);
    } else {
      setUnavailable(true);
    }
  }

  function retry() {
    setUnavailable(false);
    setSourceIndex(0);
  }

  return <>
    <TileLayer
      key={source.id}
      url={source.url}
      attribution={source.attribution}
      eventHandlers={{ tileerror: handleTileError }}
    />
    {sourceIndex > 0 && !unavailable && <div className="map-tile-status" role="status">
      {isEnglish ? "Using backup map tiles." : "Đang dùng máy chủ bản đồ dự phòng."}
    </div>}
    {unavailable && <div className="map-tile-status map-tile-error" role="status">
      <span>{isEnglish
        ? hasBackupProvider
          ? "Map tiles could not be reached from this network. Check your connection or retry."
          : "Map tiles could not be reached. No backup provider is configured; try another network or configure NEXT_PUBLIC_MAPTILER_KEY in Vercel and redeploy."
        : hasBackupProvider
          ? "Không kết nối được máy chủ bản đồ từ mạng này. Hãy kiểm tra kết nối hoặc thử lại."
          : "Không kết nối được máy chủ bản đồ. Chưa cấu hình máy chủ dự phòng; hãy thử mạng khác hoặc thêm NEXT_PUBLIC_MAPTILER_KEY trong Vercel rồi redeploy."}</span>
      <button type="button" className="button button-secondary" onClick={retry}>{isEnglish ? "Retry" : "Thử lại"}</button>
    </div>}
  </>;
}
