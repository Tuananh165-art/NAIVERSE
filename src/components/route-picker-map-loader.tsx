"use client";

import dynamic from "next/dynamic";
import type { RoutePin } from "@/components/route-picker-map";

const RoutePickerMap = dynamic(() => import("@/components/route-picker-map").then((module) => module.RoutePickerMap), { ssr: false, loading: () => <div className="map" aria-label="Loading map"/> });

export function RoutePickerMapLoader(props: { pins: RoutePin[]; onAdd: (latitude: number, longitude: number) => void; fastest?: [number, number][]; shortest?: [number, number][] }) {
  return <RoutePickerMap {...props}/>;
}
