"use client";

// Stage 08
// Step 06
//
// Purpose: highlights the POIs returned by the last AI answer — colored
// markers plus fitting the map to them (or flying to a single point), so
// asking a question visibly does something on the map, not just in chat.

import { useEffect } from "react";
import { Marker, useMap } from "react-leaflet";
import { getDotIcon } from "./markerIcon";

const AI_RESULT_COLOR = "#7c3aed";

interface AIResultPoint {
  name: string | null;
  lon: number;
  lat: number;
}

export function AIResultMarkers({ points }: { points: AIResultPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.flyTo([points[0].lat, points[0].lon], 15, { duration: 1.2 });
    } else {
      const bounds = points.map((p) => [p.lat, p.lon] as [number, number]);
      map.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 });
    }
  }, [map, points]);

  const icon = getDotIcon(AI_RESULT_COLOR);

  return (
    <>
      {points.map((p, i) => (
        <Marker key={`${p.lon}-${p.lat}-${i}`} position={[p.lat, p.lon]} icon={icon} />
      ))}
    </>
  );
}
