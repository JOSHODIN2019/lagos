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

// CARTO's free anonymous basemap tiles (previously used here) started
// requiring an API key at some point after this was built — every tile
// came back watermarked "API KEY REQUIRED". Switched to OpenStreetMap's
// standard tile server, which has no key requirement at all, in exchange
// for losing a dedicated dark-mode map style (OSM only has one style, so
// dark theme shows the same light map as light theme).
const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const LIGHT_TILES = OSM_TILES;
const DARK_TILES = OSM_TILES;

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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
