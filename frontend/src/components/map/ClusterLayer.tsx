"use client";

// Stage 01
// Step 09
//
// Purpose: renders one layer's features as a Leaflet marker-cluster group.
// react-leaflet has no first-party clustering, so this drives
// leaflet.markercluster imperatively via the useMap() escape hatch, matching
// the recommended pattern for wrapping non-React Leaflet plugins.

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import { GeoJSONFeatureCollection, PlaceDetail } from "@/lib/types";
import { getDotIcon } from "./markerIcon";

interface ClusterLayerProps {
  data: GeoJSONFeatureCollection;
  layerId: string;
  color: string;
  label: string;
  onSelectFeature: (place: PlaceDetail) => void;
}

export function ClusterLayer({
  data,
  layerId,
  color,
  label,
  onSelectFeature,
}: ClusterLayerProps) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          html: `<span class="lagos-cluster" style="background:${color}">${cluster.getChildCount()}</span>`,
          className: "lagos-cluster-wrapper",
          iconSize: [36, 36],
        }),
    });

    const icon = getDotIcon(color);

    data.features.forEach((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      const name = feature.properties.name || label;
      const marker = L.marker([lat, lon], { icon });

      marker.on("click", () => {
        onSelectFeature({
          name,
          layerId,
          layerLabel: label,
          color,
          lon,
          lat,
          properties: feature.properties,
        });
      });

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, data, layerId, color, label, onSelectFeature]);

  return null;
}
