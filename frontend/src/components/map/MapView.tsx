"use client";

// Stage 01
// Step 10
//
// Purpose: the Leaflet map surface itself — base tiles centered on Lagos,
// Nigeria, plus one ClusterLayer per currently-visible, loaded layer.

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { GeoJSONFeatureCollection, LayerMeta, PlaceDetail } from "@/lib/types";
import { ClusterLayer } from "./ClusterLayer";
import { FlyToController } from "./FlyToController";
import { PlaceDetailMarker } from "./PlaceDetailMarker";
import { ReportClickCapture } from "./ReportClickCapture";
import { AIResultMarkers } from "./AIResultMarkers";
import { getDotIcon } from "./markerIcon";
import { Marker } from "react-leaflet";
import { useTheme } from "@/components/theme/ThemeProvider";

const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];
const REPORT_PIN_COLOR = "#f59e0b";

interface MapViewProps {
  layers: LayerMeta[];
  visibleIds: Set<string>;
  dataCache: Record<string, GeoJSONFeatureCollection>;
  selectedResult: PlaceDetail | null;
  onSelectFeature: (place: PlaceDetail) => void;
  reportMode: boolean;
  onPickReportLocation: (lat: number, lon: number) => void;
  reportPin: { lat: number; lon: number } | null;
  aiMapPoints: { name: string | null; lon: number; lat: number }[];
}

const LIGHT_TILES =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export function MapView({
  layers,
  visibleIds,
  dataCache,
  selectedResult,
  onSelectFeature,
  reportMode,
  onPickReportLocation,
  reportPin,
  aiMapPoints,
}: MapViewProps) {
  const { theme } = useTheme();

  return (
    <MapContainer
      center={LAGOS_CENTER}
      zoom={11}
      className={`h-full w-full ${reportMode ? "cursor-crosshair" : ""}`}
      zoomControl={false}
    >
      <TileLayer
        key={theme}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={theme === "dark" ? DARK_TILES : LIGHT_TILES}
      />
      {layers
        .filter((layer) => visibleIds.has(layer.id) && dataCache[layer.id])
        .map((layer) => (
          <ClusterLayer
            key={layer.id}
            data={dataCache[layer.id]}
            layerId={layer.id}
            color={layer.color}
            label={layer.label}
            onSelectFeature={onSelectFeature}
          />
        ))}
      <FlyToController
        target={
          selectedResult
            ? { lat: selectedResult.lat, lon: selectedResult.lon }
            : null
        }
      />
      {selectedResult && (
        <PlaceDetailMarker
          key={`${selectedResult.layerId}-${selectedResult.name}-${selectedResult.lon}-${selectedResult.lat}`}
          result={selectedResult}
        />
      )}
      {reportMode && <ReportClickCapture onPick={onPickReportLocation} />}
      {reportPin && (
        <Marker
          position={[reportPin.lat, reportPin.lon]}
          icon={getDotIcon(REPORT_PIN_COLOR)}
        />
      )}
      {aiMapPoints.length > 0 && <AIResultMarkers points={aiMapPoints} />}
    </MapContainer>
  );
}
